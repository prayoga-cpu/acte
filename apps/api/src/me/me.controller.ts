import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { MeService } from "./me.service.js";

@Controller("v1/me")
@UseGuards(SessionGuard)
export class MeController {
  constructor(@Inject(MeService) private readonly meService: MeService) {}

  @Get("summary")
  summary(@CurrentFirm() ctx: FirmContext) {
    return this.meService.summary(ctx);
  }

  @Get("week")
  week(@CurrentFirm() ctx: FirmContext) {
    return this.meService.week(ctx);
  }

  @Get("stats")
  stats(@CurrentFirm() ctx: FirmContext) {
    return this.meService.stats(ctx);
  }
}
