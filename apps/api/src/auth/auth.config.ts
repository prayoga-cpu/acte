import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { db, type Database } from "../db/client.js";
import { account, session, user, verification } from "../db/schema/index.js";
import { FirmsRepository } from "../data-access/firms.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { sendMagicLinkEmail, sendPasswordResetEmail, sendVerificationEmail } from "../email/brevo.service.js";
import { invitationAcceptance, silentSignup } from "./invitation-context.js";

/**
 * Firm creation on first signup (STATUS.md stage 1): an auth user created
 * by a plain signup (password or magic link) always becomes the founding
 * partner of a brand-new firm. It never joins an existing firm, whatever
 * its email — joining happens only through POST /v1/invitations/:token/accept,
 * which binds by token (see invitation-context.ts and D-014).
 *
 * better-auth runs this after the user row is already committed, so the
 * firm + founder inserts are one transaction, and if they fail the user is
 * deleted again (sessions/accounts cascade) — otherwise a failure here would
 * leave an account that can sign in but never resolve to a firm.
 */
async function createFirmForNewUser(created: { id: string; email: string; name: string }) {
  if (invitationAcceptance.getStore()) return;
  try {
    await db.transaction(async (tx) => {
      const txDb = tx as unknown as Database;
      const firm = await new FirmsRepository(txDb, masterKeyFromEnv()).create(firmNameFromEmail(created.email));
      await new MembersRepository(txDb).createFounder({
        authUserId: created.id,
        email: created.email,
        displayName: created.name || created.email,
        firmId: firm.id,
      });
    });
  } catch (err) {
    await new MembersRepository(db).deleteAuthUser(created.id);
    throw err;
  }
}

function firmNameFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? "cabinet";
  return domain.split(".")[0] ?? "cabinet";
}

function masterKeyFromEnv() {
  // Re-derived here (rather than injected) because better-auth's config is
  // built once at module load, outside Nest's DI graph.
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) throw new Error("ENCRYPTION_MASTER_KEY is not set");
  return Buffer.from(hex, "hex");
}

const webOrigin = () => process.env.WEB_ORIGIN ?? "http://localhost:3000";

/**
 * An emailed auth link, rebuilt to open on the web app's origin and to come
 * back to `path` there. better-auth builds these links on its own base URL
 * and returns to "/" on it. Where the API has its own host, that sets the
 * session cookie for the API's host — which the web app never sees — and
 * lands on the API's 404 (BUG-4). Through the web origin, the request reaches
 * the API by the app's own `/v1` rewrite and the cookie belongs to the app.
 * Set here rather than trusted from the request.
 */
function emailedLink(url: string, path: string): string {
  const link = new URL(url);
  const web = new URL(webOrigin());
  link.protocol = web.protocol;
  link.host = web.host;
  link.searchParams.set("callbackURL", `${web.origin}${path}`);
  return link.toString();
}

/** Roughly what an email send takes, so "no such account" doesn't answer conspicuously faster than "sent". */
const sendLikePause = () => new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  basePath: "/v1/auth",
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    // D-017 (closes B5): an account is unusable until its address is proven.
    // Without this, anyone could register someone else's address, and
    // better-auth deletes an unverified account's password the first time
    // its real owner signs in by magic link (BUG-3).
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user: account, url }) => {
      // Only called for an existing account: a send failure must not turn into an error only they would get.
      try {
        await sendPasswordResetEmail(account.email, emailedLink(url, "/reset-password"));
      } catch {
        console.error("[auth] a password-reset email could not be sent");
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // A sign-in attempt before verifying re-sends the link, so a lost email isn't a dead end.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user: account, url }) => {
      // An accepted invitation already proved the address, and the seed presets it.
      if (invitationAcceptance.getStore() || silentSignup.getStore()) return;
      await sendVerificationEmail(account.email, emailedLink(url, "/dashboard"));
    },
  },
  plugins: [
    magicLink({
      // A magic link signs in to an existing account; it never founds a firm.
      // Accounts are created by /signup (verified by email) or an invitation.
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        // No account, no email — and the same answer either way, in about the same time, so the form doesn't
        // reveal who has an account. That includes a send that fails: it is logged (never the address or the
        // link), not turned into an error an unknown address would never get.
        if (!(await new MembersRepository(db).authAccountExists(email))) {
          await sendLikePause();
          return;
        }
        try {
          await sendMagicLinkEmail(email, emailedLink(url, "/dashboard"));
        } catch {
          console.error("[auth] a magic-link email could not be sent");
        }
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await createFirmForNewUser(createdUser);
        },
      },
    },
    session: {
      create: {
        // A suspended member gets no session at all (password or magic link),
        // not a session that then 401s everywhere. No member row yet (a signup
        // mid-flight) is fine — that's not a suspension.
        before: async (newSession) => {
          const member = await new MembersRepository(db).findByAuthUserId(newSession.userId);
          if (member?.status === "suspended") {
            throw new APIError("FORBIDDEN", { message: "Member account suspended", code: "MEMBER_SUSPENDED" });
          }
        },
      },
    },
  },
});
