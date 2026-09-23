import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./columns";
import { invoiceStatusEnum } from "./enums";
import { dossiers } from "./dossier";
import { firms } from "./firm";

/** Firm-to-client invoice drafts (Billing view). Stripe subscription billing is separate (stage 6). */
export const clientInvoices = pgTable("client_invoice", {
  id: idColumn(),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  dossierId: uuid("dossier_id")
    .notNull()
    .references(() => dossiers.id, { onDelete: "cascade" }),
  number: text("number").notNull(), // "FA-2026-041"
  periodLabel: text("period_label").notNull(), // 🔒
  minutes: integer("minutes").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  ...timestamps,
});
