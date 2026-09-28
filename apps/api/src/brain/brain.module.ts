import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { DossiersModule } from "../dossiers/dossiers.module.js";
import { MeModule } from "../me/me.module.js";
import { ActivityController } from "./activity.controller.js";
import { ActivityService } from "./activity.service.js";
import { BrainController } from "./brain.controller.js";
import { BrainService } from "./brain.service.js";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { LlmClient } from "./llm.client.js";

@Module({
  imports: [AuthModule, MeModule, DossiersModule],
  controllers: [BrainController, ActivityController, ChatController],
  providers: [BrainService, ActivityService, ChatService, { provide: LlmClient, useFactory: () => LlmClient.fromEnv() }],
})
export class BrainModule {}
