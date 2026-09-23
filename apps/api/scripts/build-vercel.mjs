// Bundles vercel-entry.ts into a single self-contained CommonJS file for
// Vercel's Node.js runtime. See the comment atop vercel-entry.ts for why
// this needs to be a real bundle rather than letting Vercel transpile and
// run each source file individually. CJS (not ESM) output sidesteps the
// same problem again at the require() level, and lets Node run the file
// with zero special loader configuration.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync(new URL("../api", import.meta.url), { recursive: true });

await build({
  entryPoints: ["vercel-entry.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: "api/index.js",
  logLevel: "info",
  // Optional peer packages NestJS conditionally requires that this app
  // never installs (no microservices/websockets/GraphQL here) — esbuild
  // can't resolve them at bundle time, which is expected; they're only
  // reachable if you actually use those features.
  external: [
    "@nestjs/microservices",
    "@nestjs/websockets/socket-module",
    "class-transformer",
    "class-transformer/storage",
    "class-validator",
    "cache-manager",
  ],
});
