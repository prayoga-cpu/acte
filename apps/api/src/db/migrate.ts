import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, queryClient } from "./client.js";

async function main() {
  await migrate(db, { migrationsFolder: new URL("./migrations", import.meta.url).pathname });
  await queryClient.end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
