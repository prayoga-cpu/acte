import { Body, Controller, Get, HttpCode, Inject, Param, Post, Res } from "@nestjs/common";
import { AcceptInvitationBody } from "@acte/contracts";
import type { Response } from "express";
import type { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { InvitationsService } from "./invitations.service.js";

/** Public, token-gated — the invitee has no session yet. The token is the credential. */
@Controller("v1/invitations")
export class InvitationsController {
  constructor(@Inject(InvitationsService) private readonly invitations: InvitationsService) {}

  @Get(":token")
  preview(@Param("token") token: string) {
    return this.invitations.preview(token);
  }

  @Post(":token/accept")
  @HttpCode(204)
  async accept(
    @Param("token") token: string,
    @Body(new ZodValidationPipe(AcceptInvitationBody)) body: z.infer<typeof AcceptInvitationBody>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { setCookies } = await this.invitations.accept(token, body);
    if (setCookies.length) res.setHeader("set-cookie", setCookies);
  }
}
