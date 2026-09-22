import { Body, Controller, Get, Inject, Post, UseGuards, UsePipes } from "@nestjs/common";
import { GenerateInvoiceBody } from "@acte/contracts";
import type { z } from "zod";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { BillingService } from "./billing.service.js";

@Controller("v1/billing")
@UseGuards(SessionGuard)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Get("invoices")
  list(@CurrentFirm() ctx: FirmContext) {
    return this.billing.list(ctx);
  }

  @Post("invoices")
  @UsePipes(new ZodValidationPipe(GenerateInvoiceBody))
  generate(@CurrentFirm() ctx: FirmContext, @Body() body: z.infer<typeof GenerateInvoiceBody>) {
    return this.billing.generateDraft(ctx, body.dossierId);
  }
}
