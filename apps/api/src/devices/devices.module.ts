import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { DevicesController } from "./devices.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [DevicesController],
})
export class DevicesModule {}
