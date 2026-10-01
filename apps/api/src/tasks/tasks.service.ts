import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateManualTaskBody, UpdateTaskBody, ValidateTasksBody } from "@acte/contracts";
import type { z } from "zod";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import { parisDateKey } from "../lib/time.js";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class TasksService {
  constructor(
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  list(ctx: FirmContext, date?: string) {
    if (date !== undefined && !DATE_KEY.test(date)) {
      throw new BadRequestException({ error: { code: "invalid_date", message: "date must be YYYY-MM-DD" } });
    }
    return this.tasks.listForMember(ctx, date);
  }

  /** Pending tasks from before today (Paris): they would otherwise be invisible in a Journal that shows one day. */
  backlog(ctx: FirmContext) {
    return this.tasks.listBacklog(ctx, parisDateKey(new Date()));
  }

  /** Firm-scoped and not archived — PRODUCT_SPEC.md: "Archived dossiers stop receiving captures." */
  private async assertAssignableDossier(ctx: FirmContext, dossierId: string) {
    const dossier = await this.dossiers.findById(ctx, dossierId);
    if (!dossier || dossier.status === "archived") {
      throw new BadRequestException({ error: { code: "dossier_not_assignable", message: "Unknown or archived dossier" } });
    }
  }

  /** The rate stamped on a task at validation: the member's rate at that moment. */
  private async currentRateCents(ctx: FirmContext): Promise<number> {
    const member = await this.members.findById(ctx.firmId, ctx.memberId);
    if (!member) throw new NotFoundException({ error: { code: "member_not_found", message: "Member not found" } });
    return member.hourlyRateCents;
  }

  async createManual(ctx: FirmContext, body: z.infer<typeof CreateManualTaskBody>) {
    if (body.dossierId) await this.assertAssignableDossier(ctx, body.dossierId);
    const task = await this.tasks.createManual(ctx, body);
    if (body.dossierId) {
      await this.dossiers.touchActivity(ctx, body.dossierId, new Date());
    }
    await this.auditLog.record(ctx, "task.create", "task", task.id);
    return task;
  }

  /** `dossierId` reassigns (and logs a correction); the other fields edit a still-pending task. */
  async update(ctx: FirmContext, taskId: string, body: z.infer<typeof UpdateTaskBody>) {
    const { dossierId, ...edits } = body;
    const hasEdits = Object.keys(edits).length > 0;
    const current = await this.tasks.findOwnedById(ctx, taskId);
    if (!current) throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found" } });

    if (hasEdits && current.status !== "pending") {
      throw new ConflictException({ error: { code: "task_not_pending", message: "Only a pending task can be edited" } });
    }
    const reassign = dossierId !== undefined && dossierId !== current.dossierId;
    if (reassign) {
      if (current.invoiceId) {
        throw new ConflictException({ error: { code: "task_invoiced", message: "This time is already on an invoice draft" } });
      }
      await this.assertAssignableDossier(ctx, dossierId);
    }

    let task = current;
    if (hasEdits) {
      const edited = await this.tasks.updatePending(ctx, taskId, edits);
      if (!edited) throw new ConflictException({ error: { code: "task_not_pending", message: "Only a pending task can be edited" } });
      task = { ...edited, corrected: current.corrected };
      await this.auditLog.record(ctx, "task.update", "task", taskId);
    }
    if (reassign) {
      const moved = await this.tasks.reassign(ctx, taskId, dossierId);
      if (!moved) throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found" } });
      task = moved;
      await this.auditLog.record(ctx, "task.reassign", "task", taskId);
      await this.dossiers.touchActivity(ctx, dossierId, new Date());
    }
    return task;
  }

  async discard(ctx: FirmContext, taskId: string): Promise<void> {
    const discarded = await this.tasks.discardPending(ctx, taskId);
    if (!discarded) {
      throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found or no longer pending" } });
    }
    await this.auditLog.record(ctx, "task.discard", "task", taskId);
  }

  async validate(ctx: FirmContext, taskId: string) {
    const task = await this.tasks.validate(ctx, taskId, await this.currentRateCents(ctx));
    if (!task) {
      throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found or already validated" } });
    }
    await this.auditLog.record(ctx, "task.validate", "task", taskId);
    return task;
  }

  async unvalidate(ctx: FirmContext, taskId: string) {
    const current = await this.tasks.findOwnedById(ctx, taskId);
    if (!current || current.status !== "validated") {
      throw new NotFoundException({ error: { code: "task_not_found", message: "Task not found or not validated" } });
    }
    if (current.invoiceId) {
      throw new ConflictException({ error: { code: "task_invoiced", message: "This time is already on an invoice draft" } });
    }
    const task = await this.tasks.unvalidate(ctx, taskId);
    if (!task) throw new ConflictException({ error: { code: "task_invoiced", message: "This time is already on an invoice draft" } });
    await this.auditLog.record(ctx, "task.unvalidate", "task", taskId);
    return { ...task, corrected: current.corrected };
  }

  /** Validates exactly the listed tasks — the ones the Journal showed — not every pending task of the member. */
  async validateMany(ctx: FirmContext, body: z.infer<typeof ValidateTasksBody>) {
    const validated = await this.tasks.validateMany(ctx, body.taskIds, await this.currentRateCents(ctx));
    if (validated.length > 0) await this.auditLog.record(ctx, "task.validate_all", "task", null);
    return validated;
  }
}
