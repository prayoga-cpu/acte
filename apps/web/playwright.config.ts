import { defineConfig } from "@playwright/test";

/**
 * docs/04-engineering/TESTING.md: "Web | Playwright | Each ported view:
 * renders seeded data; key actions work." Runs against an already-seeded
 * local stack (API on :4000, Postgres seeded via `pnpm --filter @acte/api
 * db:seed`) — it does not start or seed anything itself.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // Pin French regardless of the runner's own Accept-Language: the suite's
    // assertions are French-only, and the app's real Accept-Language-based
    // device detection (apps/web/src/lib/locale-server.ts) would otherwise
    // render English here, since CI/local browsers commonly default to an
    // en-* locale. A manual switch or the `acte-locale` cookie still take
    // priority over this in the app itself.
    locale: "fr-FR",
  },
});
