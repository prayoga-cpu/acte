import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CreateManualTaskBody, UpdateTaskBody, ValidateTasksBody } from "@acte/contracts";
import type { z } from "zod";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { TasksService } from "./tasks.service.js";

@Controller("v1/tasks")
@UseGuards(SessionGuard)
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext, @Query("date") date?: string) {
    return this.tasksService.list(ctx, date);
  }

  @Get("backlog")
  backlog(@CurrentFirm() ctx: FirmContext) {
    return this.tasksService.backlog(ctx);
  }

  @Post()
  create(@CurrentFirm() ctx: FirmContext, @Body(new ZodValidationPipe(CreateManualTaskBody)) body: z.infer<typeof CreateManualTaskBody>) {
    return this.tasksService.createManual(ctx, body);
  }

  @Post("validate-all")
  @HttpCode(200)
  validateAll(@CurrentFirm() ctx: FirmContext, @Body(new ZodValidationPipe(ValidateTasksBody)) body: z.infer<typeof ValidateTasksBody>) {
    return this.tasksService.validateMany(ctx, body);
  }

  @Patch(":id")
  update(
    @CurrentFirm() ctx: FirmContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateTaskBody)) body: z.infer<typeof UpdateTaskBody>,
  ) {
    return this.tasksService.update(ctx, id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  discard(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.tasksService.discard(ctx, id);
  }

  @Post(":id/validate")
  @HttpCode(200)
  validate(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.tasksService.validate(ctx, id);
  }

  @Post(":id/unvalidate")
  @HttpCode(200)
  unvalidate(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.tasksService.unvalidate(ctx, id);
  }
}
