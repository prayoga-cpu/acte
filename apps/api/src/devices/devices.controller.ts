import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { DevicesRepository } from "../data-access/devices.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

/** Read-only: force sync / unlink actions are stage 4 (apps/tracker is gated). */
@Controller("v1/devices")
@UseGuards(SessionGuard)
export class DevicesController {
  constructor(@Inject(DevicesRepository) private readonly devices: DevicesRepository) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext) {
    return this.devices.listForMember(ctx);
  }
}
