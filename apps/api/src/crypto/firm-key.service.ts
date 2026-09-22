import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { firms } from "../db/schema/index.js";
import { loadMasterKey, unwrapDataKey } from "./field-encryption.js";

export const MASTER_KEY = Symbol("MASTER_KEY");

export function masterKeyProvider() {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) {
    throw new Error("ENCRYPTION_MASTER_KEY is not set");
  }
  return loadMasterKey(hex);
}

/**
 * Resolves a firm's unwrapped data key so the data-access layer can encrypt
 * and decrypt 🔒 columns. This is the only place that touches the master key.
 */
@Injectable()
export class FirmKeyService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(MASTER_KEY) private readonly masterKey: Buffer,
  ) {}

  async getDataKey(firmId: string): Promise<Buffer> {
    const [firm] = await this.db.select({ dataKeyWrapped: firms.dataKeyWrapped }).from(firms).where(eq(firms.id, firmId));
    if (!firm) {
      throw new Error(`Unknown firm: ${firmId}`);
    }
    return unwrapDataKey(firm.dataKeyWrapped, this.masterKey);
  }
}
