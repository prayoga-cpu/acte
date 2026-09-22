import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { bytea, idColumn, timestamps } from "./columns";

export const firms = pgTable("firm", {
  id: idColumn(),
  name: text("name").notNull(), // 🔒 encrypted with this row's own data key
  seatCount: integer("seat_count").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"), // stage 6
  dataKeyWrapped: bytea("data_key_wrapped").notNull(),
  ...timestamps,
});
