import { mkdirSync, rmSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { applyRouteTestEnv, OUTBOX_DIR, routeTestDatabaseUrl } from "./env";

/** Fresh database + empty outbox for every run. Local only: refuses a non-local host. */
export default async function setup() {
  applyRouteTestEnv();
  const url = new URL(routeTestDatabaseUrl());
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error(`Route tests only run against a local database, not ${url.hostname}`);
  }
  const dbName = url.pathname.slice(1);
  if (!/^[a-z0-9_]+_routes$/.test(dbName)) throw new Error(`Unexpected route-test database name: ${dbName}`);

  const admin = new URL(url);
  admin.pathname = "/postgres";
  const adminClient = postgres(admin.toString(), { max: 1, onnotice: () => undefined });
  await adminClient.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  await adminClient.unsafe(`CREATE DATABASE "${dbName}"`);
  await adminClient.end();

  const client = postgres(url.toString(), { max: 1, onnotice: () => undefined });
  await migrate(drizzle(client), { migrationsFolder: "src/db/migrations" });
  await client.end();

  rmSync(OUTBOX_DIR, { recursive: true, force: true });
  mkdirSync(OUTBOX_DIR, { recursive: true });
}
