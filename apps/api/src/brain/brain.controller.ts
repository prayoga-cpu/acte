import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { BrainService } from "./brain.service.js";

@Controller("v1/me/insights")
@UseGuards(SessionGuard)
export class BrainController {
  constructor(@Inject(BrainService) private readonly brain: BrainService) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext) {
    return this.brain.insights(ctx);
  }
}
