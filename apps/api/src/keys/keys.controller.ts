import { Controller, Delete, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { KeysService } from "./keys.service.js";

@Controller("v1/me/keys")
@UseGuards(SessionGuard)
export class KeysController {
  constructor(@Inject(KeysService) private readonly keysService: KeysService) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext) {
    return this.keysService.list(ctx);
  }

  @Post()
  create(@CurrentFirm() ctx: FirmContext) {
    return this.keysService.create(ctx);
  }

  @Delete(":id")
  revoke(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.keysService.revoke(ctx, id);
  }
}
