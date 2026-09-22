import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { activationKeys } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";

function generatePlainKey(initials: string): string {
  const groups = Array.from({ length: 4 }, () => randomBytes(2).toString("hex").toUpperCase());
  return `ACTE-${initials.toUpperCase()}-${groups.join("-")}`;
}

function hashKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

/** The plain key is returned once, at creation, and never stored (docs/02-architecture/ARCHITECTURE.md "Keys"). */
@Injectable()
export class ActivationKeysRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async create(ctx: FirmContext, memberInitials: string) {
    const plainKey = generatePlainKey(memberInitials);
    const [row] = await this.db
      .insert(activationKeys)
      .values({
        memberId: ctx.memberId,
        prefix: plainKey.slice(0, 13), // "ACTE-VC-7F42"
        keyHash: hashKey(plainKey),
      })
      .returning();
    return { id: row!.id, prefix: row!.prefix, plainKey };
  }

  async list(ctx: FirmContext) {
    return this.db.select().from(activationKeys).where(eq(activationKeys.memberId, ctx.memberId));
  }

  async revoke(ctx: FirmContext, id: string) {
    const [row] = await this.db
      .update(activationKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(activationKeys.memberId, ctx.memberId), eq(activationKeys.id, id), isNull(activationKeys.revokedAt)))
      .returning();
    return row ?? null;
  }
}
