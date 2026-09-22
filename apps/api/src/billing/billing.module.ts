import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BillingController } from "./billing.controller.js";
import { BillingService } from "./billing.service.js";
import { ExportsController } from "./exports.controller.js";
import { ExportsService } from "./exports.service.js";

@Module({
  imports: [AuthModule],
  controllers: [BillingController, ExportsController],
  providers: [BillingService, ExportsService],
})
export class BillingModule {}
