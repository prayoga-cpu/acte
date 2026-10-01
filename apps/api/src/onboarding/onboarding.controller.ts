import { Controller, Get, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { OnboardingService } from "./onboarding.service.js";

@Controller("v1/me/onboarding")
@UseGuards(SessionGuard)
export class OnboardingController {
  constructor(@Inject(OnboardingService) private readonly onboardingService: OnboardingService) {}

  @Get()
  state(@CurrentFirm() ctx: FirmContext) {
    return this.onboardingService.state(ctx);
  }

  @Post("complete")
  @HttpCode(200)
  complete(@CurrentFirm() ctx: FirmContext) {
    return this.onboardingService.complete(ctx);
  }
}
