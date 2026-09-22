import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, queryClient } from "./client.js";

// Migrations are static SQL, not compiled — reference the source folder
// (relative to the package root, i.e. wherever this is run from) rather
// than a path relative to this file, which would point into dist/ and not
// exist there once built.
async function main() {
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  await queryClient.end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
