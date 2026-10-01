import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { FeedbackBody, FeedbackCreated, FeedbackEntry } from "@acte/contracts";
import type { z } from "zod";
import { AdminGuard } from "../auth/admin.guard.js";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { FeedbackRepository } from "../data-access/feedback.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

/**
 * Feedback to the ACTE team (ROADMAP stage 6, built early under D-019).
 * Any member can send; the list is the firm's own, for its admins.
 */
@Controller("v1/feedback")
@UseGuards(SessionGuard)
export class FeedbackController {
  constructor(
    @Inject(FeedbackRepository) private readonly feedback: FeedbackRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  @Post()
  async send(@CurrentFirm() ctx: FirmContext, @Body(new ZodValidationPipe(FeedbackBody)) body: z.infer<typeof FeedbackBody>) {
    const created = await this.feedback.create(ctx, body);
    await this.auditLog.record(ctx, "feedback.send", "feedback", created.id);
    return FeedbackCreated.parse(created);
  }

  @Get()
  @UseGuards(AdminGuard)
  async list(@CurrentFirm() ctx: FirmContext) {
    return FeedbackEntry.array().parse(await this.feedback.listByFirm(ctx));
  }
}
