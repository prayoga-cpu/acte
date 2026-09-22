import { customType, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../lib/uuid.js";

/** Postgres `bytea`, used only for `firm.data_key_wrapped` (see field-encryption.ts). */
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const idColumn = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7());

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
