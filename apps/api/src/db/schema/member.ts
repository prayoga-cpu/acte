import { boolean, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns";
import { memberRoleEnum, memberStatusEnum } from "./enums";
import { firms } from "./firm";

export const members = pgTable("member", {
  id: idColumn(),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  // Links to better-auth's `user.id`. Email is duplicated (lowercased) here for
  // firm-scoped uniqueness and lookups without joining the auth tables.
  authUserId: text("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  initials: text("initials").notNull(),
  role: memberRoleEnum("role").notNull(),
  isPartner: boolean("is_partner").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false), // enforcement gated by D-004
  hourlyRateCents: integer("hourly_rate_cents").notNull().default(0),
  status: memberStatusEnum("status").notNull().default("active"),
  // Settings view "Sources surveillées" — per-member on/off, not yet acted on
  // by anything real since the Companion (apps/tracker) doesn't exist.
  sourceSettings: jsonb("source_settings")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({ word: true, outlook: true, web: true }),
  ...timestamps,
});
