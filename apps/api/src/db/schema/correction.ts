import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "./columns";
import { dossiers } from "./dossier";
import { members } from "./member";
import { tasks } from "./task";

/** Reassignment log. Feeds the matcher in stage 5 (docs/02-architecture/AI_MATCHING.md). */
export const corrections = pgTable("correction", {
  id: idColumn(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  fromDossierId: uuid("from_dossier_id").references(() => dossiers.id, { onDelete: "set null" }),
  toDossierId: uuid("to_dossier_id")
    .notNull()
    .references(() => dossiers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
