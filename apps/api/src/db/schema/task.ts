import { integer, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns";
import { taskSourceEnum, taskStatusEnum } from "./enums";
import { clientInvoices } from "./client-invoice";
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
  // The member's hourly rate when the task was validated — a later rate change
  // applies to the next validated time, not to this one (D-020).
  rateCents: integer("rate_cents"),
  // Set when the task's time goes onto a client invoice draft, so the same
  // time is never billed twice (D-020).
  invoiceId: uuid("invoice_id").references(() => clientInvoices.id, { onDelete: "set null" }),
  deviceId: uuid("device_id"),
  ...timestamps,
});
