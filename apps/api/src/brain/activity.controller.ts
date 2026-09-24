import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ActivityService } from "./activity.service.js";

@Controller("v1/me/activity")
@UseGuards(SessionGuard)
export class ActivityController {
  constructor(@Inject(ActivityService) private readonly activity: ActivityService) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext) {
    return this.activity.list(ctx);
  }
}
