import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "../db/client.js";
import { account, session, user, verification } from "../db/schema/index.js";
import { FirmsRepository } from "../data-access/firms.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { sendMagicLinkEmail } from "../email/brevo.service.js";

/**
 * Firm creation on first signup (STATUS.md stage 1): the auth user that
 * signs up with no invitation becomes the founding partner of a brand new
 * firm. Joining an *existing* firm happens through an invitation (stage 2)
 * and is not wired here.
 */
async function createFirmForNewUser(user: { id: string; email: string; name: string }) {
  const firmsRepo = new FirmsRepository(db, masterKeyFromEnv());
  const membersRepo = new MembersRepository(db);
  const firm = await firmsRepo.create(firmNameFromEmail(user.email));
  await membersRepo.createFounder({
    authUserId: user.id,
    email: user.email,
    displayName: user.name || user.email,
    firmId: firm.id,
  });
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
  },
});
