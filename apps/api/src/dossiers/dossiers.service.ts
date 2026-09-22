import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateDossierBody, DossierUsage, UpdateDossierBody } from "@acte/contracts";
import type { z } from "zod";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

@Injectable()
export class DossiersService {
  constructor(
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  async list(ctx: FirmContext): Promise<DossierUsage[]> {
    const [dossierList, usage] = await Promise.all([this.dossiers.list(ctx), this.tasks.minutesByDossier(ctx.firmId)]);
    const usageByDossier = new Map(usage.map((u) => [u.dossierId, u]));
    return dossierList.map((d) => ({
      ...d,
      usedMinutes: usageByDossier.get(d.id)?.validatedMin ?? 0,
      pendingMinutes: usageByDossier.get(d.id)?.pendingMin ?? 0,
    }));
  }

  async create(ctx: FirmContext, body: z.infer<typeof CreateDossierBody>) {
    const dossier = await this.dossiers.create(ctx, body);
    await this.auditLog.record(ctx, "dossier.create", "dossier", dossier.id);
    return dossier;
  }

  async update(ctx: FirmContext, id: string, body: z.infer<typeof UpdateDossierBody>) {
    const dossier = await this.dossiers.update(ctx, id, body);
    if (!dossier) {
      throw new NotFoundException({ error: { code: "dossier_not_found", message: "Dossier not found" } });
    }
    const action = body.status === "archived" ? "dossier.archive" : "dossier.update";
    await this.auditLog.record(ctx, action, "dossier", id);
    return dossier;
  }
}
