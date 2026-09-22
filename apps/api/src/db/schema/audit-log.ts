import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "./columns";
import { firms } from "./firm";
import { members } from "./member";

/** Append-only. Written on validate, reassign, dossier create/edit/archive, admin actions. */
export const auditLogs = pgTable("audit_log", {
  id: idColumn(),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  actorMemberId: uuid("actor_member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  ipHash: text("ip_hash"),
});
