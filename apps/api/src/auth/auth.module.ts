import { Module } from "@nestjs/common";
import { AdminGuard } from "./admin.guard.js";
import { AuthController } from "./auth.controller.js";
import { SessionGuard } from "./session.guard.js";

@Module({
  controllers: [AuthController],
  providers: [SessionGuard, AdminGuard],
  exports: [SessionGuard, AdminGuard],
})
export class AuthModule {}
