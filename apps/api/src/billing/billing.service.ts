import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { ClientInvoicesRepository } from "../data-access/client-invoices.repository.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { parisDateKey } from "../lib/time.js";

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });

/** "Diligences · septembre 2026", or "Diligences · août 2026 – septembre 2026" when the billed time spans months. */
function periodLabelFor(dates: Date[]): string {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const first = monthLabel.format(sorted[0]!);
  const last = monthLabel.format(sorted[sorted.length - 1]!);
  return `Diligences · ${first === last ? first : `${first} – ${last}`}`;
}

@Injectable()
export class BillingService {
  constructor(
    @Inject(ClientInvoicesRepository) private readonly invoices: ClientInvoicesRepository,
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  list(ctx: FirmContext) {
    return this.invoices.list(ctx);
  }

  /**
   * A draft bills the dossier's validated time that isn't on an invoice yet,
   * each task at the rate stamped when it was validated, and marks that time
   * as invoiced (D-020). Generating again only bills time validated since.
   */
  async generateDraft(ctx: FirmContext, dossierId: string) {
    const dossier = await this.dossiers.findById(ctx, dossierId);
    if (!dossier) {
      throw new NotFoundException({ error: { code: "dossier_not_found", message: "Dossier not found" } });
    }
    if (!dossier.isBillable || dossier.status === "archived") {
      throw new ConflictException({ error: { code: "dossier_not_billable", message: "This dossier cannot be invoiced" } });
    }

    const nothing = () => new ConflictException({ error: { code: "nothing_to_invoice", message: "No validated time left to invoice on this dossier" } });
    const lines = await this.tasks.listUninvoicedForDossier(ctx.firmId, dossierId);
    if (lines.length === 0) throw nothing();

    const created = await this.invoices.createDraftForTasks(ctx, {
      dossierId,
      year: Number(parisDateKey(new Date()).slice(0, 4)),
      periodLabel: periodLabelFor(lines.map((l) => l.startedAt)),
      lines,
    });
    if (!created) throw nothing();

    await this.auditLog.record(ctx, "invoice.draft", "client_invoice", created.id);
    return this.invoices.list(ctx);
  }
}
