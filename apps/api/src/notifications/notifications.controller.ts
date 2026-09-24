import { Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { NotificationsService } from "./notifications.service.js";

@Controller("v1/notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext) {
    return this.notifications.list(ctx);
  }

  @Post(":id/read")
  @HttpCode(204)
  markRead(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.notifications.markRead(ctx, id);
  }

  @Post("read-all")
  @HttpCode(204)
  markAllRead(@CurrentFirm() ctx: FirmContext) {
    return this.notifications.markAllRead(ctx);
  }
}
