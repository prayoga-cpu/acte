import { Inject, Injectable } from "@nestjs/common";
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
    const rateEur = (member?.hourlyRateCents ?? 0) / 100;

    const header = "Date;Dossier;Intitulé;Durée (min);Taux (€/h);Montant (€);Source";
    const rows = validatedTasks.map((t) => {
      const dossierName = t.dossierId ? (dossierNames.get(t.dossierId) ?? "") : "";
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
}
