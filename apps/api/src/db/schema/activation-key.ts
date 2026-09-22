import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "./columns.js";
import { members } from "./member.js";

/** The plain key is shown once at creation; only its hash is stored. */
export const activationKeys = pgTable("activation_key", {
  id: idColumn(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  prefix: text("prefix").notNull(), // first 8 chars, for display in lists
  keyHash: text("key_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
