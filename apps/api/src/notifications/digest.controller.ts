import { timingSafeEqual } from "node:crypto";
import { Controller, Get, Headers, HttpCode, HttpException, HttpStatus, Inject, Post, UnauthorizedException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service.js";

/**
 * The scheduled alert digest (D-019). No session: the caller is a scheduler
 * (Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on a GET), so the
 * route is closed unless CRON_SECRET is configured and matches.
 */
@Controller("v1/internal/alert-digest")
export class DigestController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  private authorize(authorization: string | undefined) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new HttpException({ error: { code: "digest_disabled", message: "Alert digest is not configured" } }, HttpStatus.SERVICE_UNAVAILABLE);
    }
    const given = Buffer.from(authorization ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new UnauthorizedException();
    }
  }

  @Get()
  runFromCron(@Headers("authorization") authorization?: string) {
    this.authorize(authorization);
    return this.notifications.sendDigests();
  }

  @Post()
  @HttpCode(200)
  run(@Headers("authorization") authorization?: string) {
    this.authorize(authorization);
    return this.notifications.sendDigests();
  }
}
