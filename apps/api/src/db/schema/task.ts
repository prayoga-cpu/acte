import { integer, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns";
import { taskSourceEnum, taskStatusEnum } from "./enums";
import { dossiers } from "./dossier";
import { firms } from "./firm";
import { members } from "./member";

export const tasks = pgTable("task", {
  id: idColumn(),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  dossierId: uuid("dossier_id").references(() => dossiers.id, { onDelete: "set null" }),
  source: taskSourceEnum("source").notNull(),
  title: text("title").notNull(), // 🔒
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").notNull(),
  confidence: smallint("confidence"),
  // why_ref intentionally absent: decision D-003 (docs/DECISIONS.md) is OPEN.
  status: taskStatusEnum("status").notNull().default("pending"),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  deviceId: uuid("device_id"),
  ...timestamps,
});
