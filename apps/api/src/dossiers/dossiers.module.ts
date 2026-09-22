import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { DossiersController } from "./dossiers.controller.js";
import { DossiersService } from "./dossiers.service.js";

@Module({
  imports: [AuthModule],
  controllers: [DossiersController],
  providers: [DossiersService],
})
export class DossiersModule {}
