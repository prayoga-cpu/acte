import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { firms } from "../db/schema/index.js";
import { decryptField, encryptField, generateDataKey, unwrapDataKey, wrapDataKey } from "../crypto/field-encryption.js";
import { MASTER_KEY } from "../crypto/firm-key.service.js";

/**
 * Firm creation is the one place a fresh per-firm data key is minted
 * (docs/02-architecture/ARCHITECTURE.md "Keys"). Called from the auth
 * signup hook — see auth/auth.config.ts.
 */
@Injectable()
export class FirmsRepository {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(MASTER_KEY) private readonly masterKey: Buffer,
  ) {}

  async create(name: string): Promise<{ id: string }> {
    const dataKey = generateDataKey();
    const [row] = await this.db
      .insert(firms)
      .values({
        name: encryptField(name, dataKey),
        seatCount: 1,
        dataKeyWrapped: wrapDataKey(dataKey, this.masterKey),
      })
      .returning({ id: firms.id });
    return row!;
  }

  async exists(firmId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: firms.id }).from(firms).where(eq(firms.id, firmId));
    return !!row;
  }

  /** Decrypted firm name — used for the invite email/preview, where showing "which firm" matters. */
  async findNameById(firmId: string): Promise<string | null> {
    const [row] = await this.db.select({ name: firms.name, dataKeyWrapped: firms.dataKeyWrapped }).from(firms).where(eq(firms.id, firmId));
    if (!row) return null;
    const dataKey = unwrapDataKey(row.dataKeyWrapped, this.masterKey);
    return decryptField(row.name, dataKey);
  }
}
