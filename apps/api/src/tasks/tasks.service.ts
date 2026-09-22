import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateManualTaskBody, ReassignTaskBody } from "@acte/contracts";
import type { z } from "zod";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";

@Injectable()
export class TasksService {
  constructor(
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  list(ctx: FirmContext, date?: string) {
    return this.tasks.listForMember(ctx, date);
  }

  async createManual(ctx: FirmContext, body: z.infer<typeof CreateManualTaskBody>) {
    const task = await this.tasks.createManual(ctx, body);
    if (body.dossierId) {
      await this.dossiers.touchActivity(ctx, body.dossierId, new Date());
    }
    return task;
  }

  async reassign(ctx: FirmContext, taskId: string, body: z.infer<typeof ReassignTaskBody>) {
    const task = await this.tasks.reassign(ctx, taskId, body.dossierId);
    if (!task) throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found" } });
    await this.auditLog.record(ctx, "task.reassign", "task", taskId);
    await this.dossiers.touchActivity(ctx, body.dossierId, new Date());
    return task;
  }

  async validate(ctx: FirmContext, taskId: string) {
    const task = await this.tasks.validate(ctx, taskId);
    if (!task) {
      throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found or already validated" } });
    }
    await this.auditLog.record(ctx, "task.validate", "task", taskId);
    return task;
  }

  async validateAll(ctx: FirmContext) {
    const validated = await this.tasks.validateAllPending(ctx);
    await this.auditLog.record(ctx, "task.validate_all", "task", null);
    return validated;
  }
}
