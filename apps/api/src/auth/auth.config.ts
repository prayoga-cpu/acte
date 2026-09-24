import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { db, type Database } from "../db/client.js";
import { account, session, user, verification } from "../db/schema/index.js";
import { FirmsRepository } from "../data-access/firms.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { sendMagicLinkEmail } from "../email/brevo.service.js";
import { invitationAcceptance } from "./invitation-context.js";

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
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
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
