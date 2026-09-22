import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { devices } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";

/** Read-only in stage 2 (Cloud & Sync view). Force sync / unlink are stage 4 — the Companion is gated. */
@Injectable()
export class DevicesRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listForMember(ctx: FirmContext) {
    return this.db.select().from(devices).where(eq(devices.memberId, ctx.memberId));
  }
}
