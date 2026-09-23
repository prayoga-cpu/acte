import { Body, Controller, Get, Inject, Patch, UseGuards } from "@nestjs/common";
import { SourceSettings } from "@acte/contracts";
import type { z } from "zod";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { MeService } from "./me.service.js";

@Controller("v1/me")
@UseGuards(SessionGuard)
export class MeController {
  constructor(@Inject(MeService) private readonly meService: MeService) {}

  @Get("profile")
  profile(@CurrentFirm() ctx: FirmContext) {
    return this.meService.profile(ctx);
  }

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

  @Get("sources")
  sources(@CurrentFirm() ctx: FirmContext) {
    return this.meService.sources(ctx);
  }

  @Patch("sources")
  updateSources(@CurrentFirm() ctx: FirmContext, @Body(new ZodValidationPipe(SourceSettings)) body: z.infer<typeof SourceSettings>) {
    return this.meService.updateSources(ctx, body);
  }
}
