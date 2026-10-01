import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, inArray, isNull, like, TransactionRollbackError } from "drizzle-orm";
import type { ClientInvoiceSummary } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { clientInvoices, dossiers, tasks } from "../db/schema/index.js";
import { decryptField, encryptField } from "../crypto/field-encryption.js";
import { FirmKeyService } from "../crypto/firm-key.service.js";
import type { FirmContext } from "./firm-context.js";

/** Postgres unique_violation — here, two drafts racing for the same invoice number. */
const isUniqueViolation = (err: unknown) => {
  const e = err as { code?: unknown; cause?: { code?: unknown } } | null;
  return (e?.code ?? e?.cause?.code) === "23505";
};

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
      .where(eq(clientInvoices.firmId, ctx.firmId))
      .orderBy(asc(clientInvoices.createdAt), asc(clientInvoices.id));

    return rows.map(({ invoice, dossierName }) => ({
      id: invoice.id,
      dossierId: invoice.dossierId,
      dossierName: decryptField(dossierName, dataKey),
      number: invoice.number,
      periodLabel: decryptField(invoice.periodLabel, dataKey),
      minutes: invoice.minutes,
      amountCents: invoice.amountCents,
      status: invoice.status,
      createdAt: invoice.createdAt.toISOString(),
    }));
  }

  /**
   * Creates a draft for exactly `taskIds` and stamps them with the new
   * invoice id, in one transaction: the stamp only lands on tasks that are
   * still un-invoiced, and the draft's totals are recomputed from the rows
   * actually stamped, so two concurrent "Générer la facture" clicks can
   * never bill the same minute twice. Returns null when nothing was left to
   * bill. The number is the next free FA-<year>-NNN for the firm; the unique
   * index makes a race retry rather than duplicate.
   */
  async createDraftForTasks(
    ctx: FirmContext,
    input: { dossierId: string; year: number; periodLabel: string; lines: { id: string; durationMin: number; rateCents: number }[] },
  ): Promise<{ id: string } | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rateById = new Map(input.lines.map((l) => [l.id, l.rateCents]));
    const prefix = `FA-${input.year}-`;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.db.transaction(async (tx) => {
          const existing = await tx
            .select({ number: clientInvoices.number })
            .from(clientInvoices)
            .where(and(eq(clientInvoices.firmId, ctx.firmId), like(clientInvoices.number, `${prefix}%`)));
          const last = existing.reduce((max, r) => Math.max(max, Number(r.number.slice(prefix.length)) || 0), 0);

          const [invoice] = await tx
            .insert(clientInvoices)
            .values({
              firmId: ctx.firmId,
              dossierId: input.dossierId,
              number: `${prefix}${String(last + 1).padStart(3, "0")}`,
              periodLabel: encryptField(input.periodLabel, dataKey),
              minutes: 0,
              amountCents: 0,
              status: "draft",
            })
            .returning({ id: clientInvoices.id });

          const stamped = await tx
            .update(tasks)
            .set({ invoiceId: invoice!.id })
            .where(
              and(
                eq(tasks.firmId, ctx.firmId),
                eq(tasks.dossierId, input.dossierId),
                eq(tasks.status, "validated"),
                isNull(tasks.invoiceId),
                inArray(tasks.id, input.lines.map((l) => l.id)),
              ),
            )
            .returning({ id: tasks.id, durationMin: tasks.durationMin });
          if (stamped.length === 0) {
            tx.rollback();
          }

          const minutes = stamped.reduce((s, t) => s + t.durationMin, 0);
          const amountCents = stamped.reduce((s, t) => s + Math.round((t.durationMin / 60) * (rateById.get(t.id) ?? 0)), 0);
          await tx.update(clientInvoices).set({ minutes, amountCents }).where(eq(clientInvoices.id, invoice!.id));
          return { id: invoice!.id };
        });
      } catch (err) {
        if (isUniqueViolation(err)) continue;
        // drizzle's tx.rollback() throws; it means "nothing left to bill".
        if (err instanceof TransactionRollbackError) return null;
        throw err;
      }
    }
    throw new Error("Could not allocate an invoice number");
  }
}
