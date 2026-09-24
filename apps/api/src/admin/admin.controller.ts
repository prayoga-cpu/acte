import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { InviteMemberBody, UpdateMemberBody } from "@acte/contracts";
import type { z } from "zod";
import { AdminGuard } from "../auth/admin.guard.js";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { AdminService } from "./admin.service.js";

/** D-004 interim: role-gated — SessionGuard resolves who's calling, AdminGuard rejects non-admins. */
@Controller("v1/firm")
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("members")
  listTeam(@CurrentFirm() ctx: FirmContext) {
    return this.admin.listTeam(ctx);
  }

  @Patch("members/:id")
  updateMember(
    @CurrentFirm() ctx: FirmContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateMemberBody)) body: z.infer<typeof UpdateMemberBody>,
  ) {
    return this.admin.updateMember(ctx, id, body);
  }

  @Post("members/:id/remind")
  remind(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.admin.remindValidation(ctx, id);
  }

  @Post("members/:id/suspend")
  suspend(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.admin.suspend(ctx, id);
  }

  @Post("members/:id/reactivate")
  reactivate(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.admin.reactivate(ctx, id);
  }

  @Post("invitations")
  invite(@CurrentFirm() ctx: FirmContext, @Body(new ZodValidationPipe(InviteMemberBody)) body: z.infer<typeof InviteMemberBody>) {
    return this.admin.invite(ctx, body);
  }

  @Post("invitations/:id/resend")
  resendInvitation(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.admin.resendInvitation(ctx, id);
  }

  @Delete("invitations/:id")
  @HttpCode(204)
  cancelInvitation(@CurrentFirm() ctx: FirmContext, @Param("id") id: string) {
    return this.admin.cancelInvitation(ctx, id);
  }
}
