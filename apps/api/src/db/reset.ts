/**
 * Drops and recreates the local dev database from scratch, then reports
 * that migrate/seed should follow. Synthetic dev/test data only (CLAUDE.md
 * §2: never real firm data in dev) — safe to wipe.
 *
 * Exists because a lost/rotated `ENCRYPTION_MASTER_KEY` leaves every
 * field-encrypted row permanently undecryptable (by design — that's what
 * the encryption is for), and there was previously no faster recovery than
 * dropping/recreating the database by hand.
 *
 * Connects to Postgres's own `postgres` maintenance database, since you
 * cannot DROP DATABASE while connected to the one being dropped.
 */
import postgres from "postgres";

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");

  const target = new URL(raw);
  const dbName = target.pathname.replace(/^\//, "");
  const owner = decodeURIComponent(target.username);

  // Local only. A shell-exported DATABASE_URL overrides --env-file, and the
  // GCM decrypt error this script exists for is exactly what a local key
  // produces against the Neon beta — so without this guard, following the
  // README in the wrong shell would wipe the shared beta database.
  const host = target.hostname.replace(/^\[|\]$/g, "");
  const localHosts = ["localhost", "127.0.0.1", "::1"];
  const explicitlyAllowed = process.env.ACTE_ALLOW_DB_RESET_HOST === host;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset a database from a deployed/production environment");
  }
  if (!localHosts.includes(host) && !explicitlyAllowed) {
    throw new Error(
      `Refusing to reset "${dbName}" on ${host}: db:reset only runs against a local database. ` +
        `(To override for one run, set ACTE_ALLOW_DB_RESET_HOST=${host} — never for a shared or deployed database.)`,
    );
  }
  const identifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!identifier.test(dbName)) throw new Error(`Refusing to reset database with an unexpected name: ${dbName}`);
  if (!identifier.test(owner)) throw new Error(`Refusing to reset database with an unexpected owner role: ${owner}`);

  const maintenance = new URL(raw);
  maintenance.pathname = "/postgres";

  const sql = postgres(maintenance.toString(), { max: 1 });
  try {
    console.log(`Resetting database "${dbName}" on ${host}...`);
    await sql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ${dbName} AND pid <> pg_backend_pid()
    `;
    await sql.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
    await sql.unsafe(`CREATE DATABASE "${dbName}" OWNER "${owner}"`);
    console.log(`Recreated "${dbName}" (owner "${owner}"). Running migrate + seed next.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
