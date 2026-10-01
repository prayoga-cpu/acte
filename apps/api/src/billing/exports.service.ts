import { Inject, Injectable } from "@nestjs/common";
import { MyDataExport } from "@acte/contracts";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { parisDateKey } from "../lib/time.js";

function csvEscape(value: string): string {
  return /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** PROTOTYPE_MAP.md `exportValidatedCsv`: `Date;Dossier;Intitulé;Durée (min);Taux (€/h);Montant (€);Source`. */
@Injectable()
export class ExportsService {
  constructor(
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
  ) {}

  async validatedCsv(ctx: FirmContext): Promise<string> {
    const [validatedTasks, dossierList, member] = await Promise.all([
      this.tasks.listValidatedForExport(ctx),
      this.dossiers.list(ctx),
      this.members.findById(ctx.firmId, ctx.memberId),
    ]);
    const dossierNames = new Map(dossierList.map((d) => [d.id, d.name]));
    const memberRateCents = member?.hourlyRateCents ?? 0;

    const header = "Date;Dossier;Intitulé;Durée (min);Taux (€/h);Montant (€);Source";
    const rows = validatedTasks.map((t) => {
      const dossierName = t.dossierId ? (dossierNames.get(t.dossierId) ?? "") : "";
      // The rate the task was validated at (D-020), not today's.
      const rateEur = (t.rateCents ?? memberRateCents) / 100;
      const amount = Math.round((t.durationMin / 60) * rateEur * 100) / 100;
      return [
        parisDateKey(new Date(t.startedAt)),
        dossierName,
        t.title,
        String(t.durationMin),
        rateEur.toFixed(2),
        amount.toFixed(2),
        t.source,
      ]
        .map(csvEscape)
        .join(";");
    });

    return [header, ...rows].join("\n");
  }

  /**
   * "Exporter mes données (.json)" (Cloud & Sync view; PRIVACY_MODEL rule 5,
   * portability): the member's own tasks, with the dossiers they point to.
   * Own data only — never another member's tasks.
   */
  async myData(ctx: FirmContext): Promise<MyDataExport> {
    const [tasks, dossierList, member] = await Promise.all([
      this.tasks.listForMember(ctx),
      this.dossiers.list(ctx),
      this.members.findById(ctx.firmId, ctx.memberId),
    ]);
    const dossierById = new Map(dossierList.map((d) => [d.id, d]));
    const usedDossierIds = new Set(tasks.map((t) => t.dossierId).filter((id): id is string => id !== null));
    // Parsed on the way out (strict schema): a field added here by mistake fails loudly instead of shipping.
    return MyDataExport.parse({
      exportedAt: new Date().toISOString(),
      member: member ? { displayName: member.displayName, email: member.email, role: member.role, hourlyRateCents: member.hourlyRateCents } : null,
      tasks: tasks.map((t) => ({
        title: t.title,
        dossier: t.dossierId ? (dossierById.get(t.dossierId)?.name ?? null) : null,
        source: t.source,
        startedAt: t.startedAt,
        endedAt: t.endedAt,
        durationMin: t.durationMin,
        status: t.status,
        validatedAt: t.validatedAt,
        rateCents: t.rateCents,
      })),
      dossiers: dossierList
        .filter((d) => usedDossierIds.has(d.id))
        .map((d) => ({ name: d.name, clientLabel: d.clientLabel, status: d.status, budgetMinutes: d.budgetMinutes })),
    });
  }
}
