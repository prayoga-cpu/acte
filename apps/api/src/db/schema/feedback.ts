import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "./columns";
import { firms } from "./firm";
import { members } from "./member";

/**
 * Feedback sent to the ACTE team from the admin console (ROADMAP stage 6,
 * built early under D-019). The message is free text a lawyer typed, so it
 * may name a client: it is field-encrypted like a task title.
 */
export const feedback = pgTable("feedback", {
  id: idColumn(),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  category: text("category").$type<"bug" | "idea" | "other">().notNull(),
  message: text("message").notNull(), // 🔒
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
