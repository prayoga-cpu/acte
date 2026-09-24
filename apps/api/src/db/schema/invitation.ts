import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns";
import { memberRoleEnum } from "./enums";
import { firms } from "./firm";
import { members } from "./member";

/**
 * D-004 interim (admin console invite flow, DECISIONS.md D-014).
 *
 * Deliberately NOT a `member` row: `member.email` is globally unique, so a
 * pending invite stored there would let one firm reserve an address for
 * every other firm (and capture that person's later signup). Here a pending
 * invite is scoped to (firm, email) and only becomes a member through
 * token-bound acceptance — see apps/api/src/admin/invitations.controller.ts.
 * The token itself is never stored, only its sha256 (same as activation keys).
 */
export const invitations = pgTable(
  "invitation",
  {
    id: idColumn(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    invitedByMemberId: uuid("invited_by_member_id").references(() => members.id, { onDelete: "set null" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("invitation_pending_firm_email_uniq").on(t.firmId, t.email).where(sql`accepted_at is null`)],
);
