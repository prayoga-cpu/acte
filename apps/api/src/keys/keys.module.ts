import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { KeysController } from "./keys.controller.js";
import { KeysService } from "./keys.service.js";

@Module({
  imports: [AuthModule],
  controllers: [KeysController],
  providers: [KeysService],
})
export class KeysModule {}
