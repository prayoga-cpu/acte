import { Body, Controller, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import { ChatRequest } from "@acte/contracts";
import type { z } from "zod";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { ChatService } from "./chat.service.js";

@Controller("v1/me/chat")
@UseGuards(SessionGuard)
export class ChatController {
  constructor(@Inject(ChatService) private readonly chat: ChatService) {}

  @Post()
  @HttpCode(200)
  reply(@CurrentFirm() ctx: FirmContext, @Body(new ZodValidationPipe(ChatRequest)) body: z.infer<typeof ChatRequest>) {
    return this.chat.reply(ctx, body);
  }
}
