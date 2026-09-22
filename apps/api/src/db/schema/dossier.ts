import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns.js";
import { dossierStatusEnum } from "./enums.js";
import { firms } from "./firm.js";

export const dossiers = pgTable("dossier", {
  id: idColumn(),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // 🔒
  clientLabel: text("client_label").notNull().default(""), // 🔒
  budgetMinutes: integer("budget_minutes"),
  status: dossierStatusEnum("status").notNull().default("progress"),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  isBillable: boolean("is_billable").notNull().default(true),
  ...timestamps,
});
