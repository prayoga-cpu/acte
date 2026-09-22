import { Injectable, Inject } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { DossierStatus } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { dossiers } from "../db/schema/index.js";
import { decryptField, encryptField } from "../crypto/field-encryption.js";
import { FirmKeyService } from "../crypto/firm-key.service.js";
import type { FirmContext } from "./firm-context.js";

export interface DossierRecord {
  id: string;
  firmId: string;
  name: string;
  clientLabel: string;
  budgetMinutes: number | null;
  status: DossierStatus;
  lastActivityAt: string | null;
  isBillable: boolean;
}

type DossierRow = typeof dossiers.$inferSelect;

/**
 * The only place that reads or writes the `dossier` table. Every query is
 * scoped to `ctx.firmId` (docs/03-security/THREAT_MODEL.md "Cross-firm access").
 */
@Injectable()
export class DossiersRepository {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(FirmKeyService) private readonly firmKeys: FirmKeyService,
  ) {}

  private decrypt(row: DossierRow, dataKey: Buffer): DossierRecord {
    return {
      id: row.id,
      firmId: row.firmId,
      name: decryptField(row.name, dataKey),
      clientLabel: row.clientLabel ? decryptField(row.clientLabel, dataKey) : "",
      budgetMinutes: row.budgetMinutes,
      status: row.status,
      lastActivityAt: row.lastActivityAt ? row.lastActivityAt.toISOString() : null,
      isBillable: row.isBillable,
    };
  }

  async list(ctx: FirmContext): Promise<DossierRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db.select().from(dossiers).where(eq(dossiers.firmId, ctx.firmId));
    return rows.map((r) => this.decrypt(r, dataKey));
  }

  async findById(ctx: FirmContext, id: string): Promise<DossierRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .select()
      .from(dossiers)
      .where(and(eq(dossiers.firmId, ctx.firmId), eq(dossiers.id, id)));
    return row ? this.decrypt(row, dataKey) : null;
  }

  async create(
    ctx: FirmContext,
    input: { name: string; clientLabel: string; budgetMinutes: number | null; isBillable?: boolean; status?: DossierStatus },
  ): Promise<DossierRecord> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .insert(dossiers)
      .values({
        firmId: ctx.firmId,
        name: encryptField(input.name, dataKey),
        clientLabel: encryptField(input.clientLabel, dataKey),
        budgetMinutes: input.budgetMinutes,
        isBillable: input.isBillable ?? true,
        status: input.status ?? "progress",
      })
      .returning();
    return this.decrypt(row!, dataKey);
  }

  async update(
    ctx: FirmContext,
    id: string,
    patch: { budgetMinutes?: number | null; status?: DossierStatus },
  ): Promise<DossierRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .update(dossiers)
      .set(patch)
      .where(and(eq(dossiers.firmId, ctx.firmId), eq(dossiers.id, id)))
      .returning();
    return row ? this.decrypt(row, dataKey) : null;
  }

  async touchActivity(ctx: FirmContext, id: string, when: Date): Promise<void> {
    await this.db
      .update(dossiers)
      .set({ lastActivityAt: when })
      .where(and(eq(dossiers.firmId, ctx.firmId), eq(dossiers.id, id)));
  }
}
