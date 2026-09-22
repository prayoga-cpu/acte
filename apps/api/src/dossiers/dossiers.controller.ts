import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards, UsePipes } from "@nestjs/common";
import { CreateDossierBody, UpdateDossierBody } from "@acte/contracts";
import type { z } from "zod";
import { CurrentFirm } from "../auth/current-firm.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { DossiersService } from "./dossiers.service.js";

@Controller("v1/dossiers")
@UseGuards(SessionGuard)
export class DossiersController {
  constructor(@Inject(DossiersService) private readonly dossiersService: DossiersService) {}

  @Get()
  list(@CurrentFirm() ctx: FirmContext) {
    return this.dossiersService.list(ctx);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateDossierBody))
  create(@CurrentFirm() ctx: FirmContext, @Body() body: z.infer<typeof CreateDossierBody>) {
    return this.dossiersService.create(ctx, body);
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(UpdateDossierBody))
  update(@CurrentFirm() ctx: FirmContext, @Param("id") id: string, @Body() body: z.infer<typeof UpdateDossierBody>) {
    return this.dossiersService.update(ctx, id, body);
  }
}
