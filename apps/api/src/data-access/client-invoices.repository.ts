import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { ClientInvoiceSummary } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { clientInvoices, dossiers } from "../db/schema/index.js";
import { decryptField, encryptField } from "../crypto/field-encryption.js";
import { FirmKeyService } from "../crypto/firm-key.service.js";
import type { FirmContext } from "./firm-context.js";

@Injectable()
export class ClientInvoicesRepository {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(FirmKeyService) private readonly firmKeys: FirmKeyService,
  ) {}

  async list(ctx: FirmContext): Promise<ClientInvoiceSummary[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db
      .select({ invoice: clientInvoices, dossierName: dossiers.name })
      .from(clientInvoices)
      .innerJoin(dossiers, eq(clientInvoices.dossierId, dossiers.id))
      .where(eq(clientInvoices.firmId, ctx.firmId));

    return rows.map(({ invoice, dossierName }) => ({
      id: invoice.id,
      dossierId: invoice.dossierId,
      dossierName: decryptField(dossierName, dataKey),
      number: invoice.number,
      periodLabel: decryptField(invoice.periodLabel, dataKey),
      minutes: invoice.minutes,
      amountCents: invoice.amountCents,
      status: invoice.status,
    }));
  }

  async createDraft(
    ctx: FirmContext,
    input: { dossierId: string; number: string; periodLabel: string; minutes: number; amountCents: number },
  ) {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    await this.db.insert(clientInvoices).values({
      firmId: ctx.firmId,
      dossierId: input.dossierId,
      number: input.number,
      periodLabel: encryptField(input.periodLabel, dataKey),
      minutes: input.minutes,
      amountCents: input.amountCents,
      status: "draft",
    });
  }
}
