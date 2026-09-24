import { sql } from "drizzle-orm";
import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { firms } from "./firm";
import { idColumn } from "./columns";
import { notificationTypeEnum } from "./enums";
import { members } from "./member";

/**
 * D-005 interim (in-app only, no external channel — DECISIONS.md D-014).
 * DATA_MODEL.md: "no free text containing client data" — the row is just
 * type + refId; the message is templated at read time from non-sensitive
 * fields, the same pattern as the Cerveau d'ACTE panel's BrainInsight.
 *
 * Each row is one *episode* of a condition (dossier over budget, member
 * lagging, invite stale): it stays open (resolved_at null) while the
 * condition holds — read or not — and is resolved when the condition
 * clears, so a later re-trigger notifies again. The partial unique index
 * makes "one open episode per (member, type, ref)" a database invariant,
 * so concurrent reads can't create duplicates.
 */
export const notifications = pgTable(
  "notification",
  {
    id: idColumn(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    refId: uuid("ref_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("notification_open_episode_uniq").on(t.memberId, t.type, t.refId).where(sql`resolved_at is null`)],
);
