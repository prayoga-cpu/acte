import { defineConfig } from "vitest/config";

/** Route tests: Supertest against the real Nest app and a throwaway Postgres database (see test/env.ts). */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    globalSetup: ["test/global-setup.ts"],
    setupFiles: ["test/setup-env.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
