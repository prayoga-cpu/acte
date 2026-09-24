import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ActivityController } from "./activity.controller.js";
import { ActivityService } from "./activity.service.js";
import { BrainController } from "./brain.controller.js";
import { BrainService } from "./brain.service.js";

@Module({
  imports: [AuthModule],
  controllers: [BrainController, ActivityController],
  providers: [BrainService, ActivityService],
})
export class BrainModule {}
