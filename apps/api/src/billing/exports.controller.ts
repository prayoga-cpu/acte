import { Controller, Get, Header, Inject, UseGuards } from "@nestjs/common";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ExportsService } from "./exports.service.js";

@Controller("v1/exports")
@UseGuards(SessionGuard)
export class ExportsController {
  constructor(@Inject(ExportsService) private readonly exportsService: ExportsService) {}

  @Get("validated.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="temps-valide.csv"')
  validatedCsv(@CurrentFirm() ctx: FirmContext) {
    return this.exportsService.validatedCsv(ctx);
  }
}
