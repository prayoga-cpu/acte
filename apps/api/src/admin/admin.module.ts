import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";
import { InvitationsController } from "./invitations.controller.js";
import { InvitationsService } from "./invitations.service.js";

@Module({
  imports: [AuthModule],
  controllers: [AdminController, InvitationsController],
  providers: [AdminService, InvitationsService],
})
export class AdminModule {}
