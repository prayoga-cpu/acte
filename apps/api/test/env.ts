import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Environment for the route tests (docs/04-engineering/TESTING.md: "API |
 * Vitest + Supertest | every route"). They run against their own database,
 * `<DATABASE_URL's name>_routes`, dropped and re-created on every run, so
 * they never touch the dev or e2e data. The secrets below are test-only
 * constants, built at runtime so no key-shaped literal sits in the repo.
 */
export function routeTestDatabaseUrl(): string {
  const base = process.env.ROUTE_TEST_BASE_URL ?? process.env.DATABASE_URL ?? "postgres://acte:acte@localhost:5432/acte";
  const url = new URL(base);
  if (!url.pathname.endsWith("_routes")) url.pathname = `${url.pathname.replace(/\/$/, "")}_routes`;
  return url.toString();
}

export const OUTBOX_DIR = join(tmpdir(), "acte-route-tests-outbox");

export function applyRouteTestEnv(): void {
  process.env.ROUTE_TEST_BASE_URL ??= process.env.DATABASE_URL ?? "postgres://acte:acte@localhost:5432/acte";
  process.env.DATABASE_URL = routeTestDatabaseUrl();
  process.env.BETTER_AUTH_SECRET = "route-tests-".padEnd(48, "x");
  process.env.ENCRYPTION_MASTER_KEY = "ab".repeat(32);
  process.env.BETTER_AUTH_URL = "http://localhost:4000";
  process.env.WEB_ORIGIN = "http://localhost:3000";
  process.env.EMAIL_DEV_OUTBOX = OUTBOX_DIR;
  process.env.NODE_ENV = "test";
  process.env.LLM_CHAT_ENABLED = "false";
  process.env.CRON_SECRET = "route-tests-cron";
  delete process.env.BREVO_API_KEY;
  delete process.env.VERCEL;
}
