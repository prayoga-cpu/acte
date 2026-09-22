import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { ClientInvoicesRepository } from "../data-access/client-invoices.repository.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

@Injectable()
export class BillingService {
  constructor(
    @Inject(ClientInvoicesRepository) private readonly invoices: ClientInvoicesRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  list(ctx: FirmContext) {
    return this.invoices.list(ctx);
  }

  async generateDraft(ctx: FirmContext, dossierId: string) {
    const dossier = await this.dossiers.findById(ctx, dossierId);
    if (!dossier) {
      throw new NotFoundException({ error: { code: "dossier_not_found", message: "Dossier not found" } });
    }

    const { minutes, amountCents } = await this.tasks.sumValidatedForDossier(ctx.firmId, dossierId);
    const existing = await this.invoices.list(ctx);
    const number = `FA-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, "0")}`;
    const periodLabel = `Diligences · ${new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date())}`;

    await this.invoices.createDraft(ctx, { dossierId, number, periodLabel, minutes, amountCents });
    await this.auditLog.record(ctx, "invoice.draft", "client_invoice", dossierId);
    return this.invoices.list(ctx);
  }
}
