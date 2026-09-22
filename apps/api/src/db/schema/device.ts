import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns.js";
import { deviceOsEnum, deviceStatusEnum } from "./enums.js";
import { members } from "./member.js";

/**
 * Companion devices. Stage 2 only reads this list for Cloud & Sync; force
 * sync / unlink actions are stage 4 (the Companion itself is gated, see
 * apps/tracker/README.md).
 */
export const devices = pgTable("device", {
  id: idColumn(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  os: deviceOsEnum("os").notNull(),
  companionVersion: text("companion_version").notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  status: deviceStatusEnum("status").notNull().default("unlinked"),
  ...timestamps,
});
