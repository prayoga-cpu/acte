import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BrainController } from "./brain.controller.js";
import { BrainService } from "./brain.service.js";

@Module({
  imports: [AuthModule],
  controllers: [BrainController],
  providers: [BrainService],
})
export class BrainModule {}
