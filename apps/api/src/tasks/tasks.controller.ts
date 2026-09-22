import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards, UsePipes } from "@nestjs/common";
import { CreateManualTaskBody, ReassignTaskBody } from "@acte/contracts";
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

  @Post()
  @UsePipes(new ZodValidationPipe(CreateManualTaskBody))
  create(@CurrentFirm() ctx: FirmContext, @Body() body: z.infer<typeof CreateManualTaskBody>) {
    return this.tasksService.createManual(ctx, body);
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(ReassignTaskBody))
  reassign(
    @CurrentFirm() ctx: FirmContext,
    @Param("id") id: string,
    @Body() body: z.infer<typeof ReassignTaskBody>,
  ) {
    return this.tasksService.reassign(ctx, id, body);
  }

  @Post(":id/validate")
  validate(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.tasksService.validate(ctx, id);
  }

  @Post("validate-all")
  validateAll(@CurrentFirm() ctx: FirmContext) {
    return this.tasksService.validateAll(ctx);
  }
}
