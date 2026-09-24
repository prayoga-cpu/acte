import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { BrainModule } from "./brain/brain.module.js";
import { CryptoModule } from "./crypto/crypto.module.js";
import { DataAccessModule } from "./data-access/data-access.module.js";
import { DbModule } from "./db/db.module.js";
import { DevicesModule } from "./devices/devices.module.js";
import { DossiersModule } from "./dossiers/dossiers.module.js";
import { KeysModule } from "./keys/keys.module.js";
import { MeModule } from "./me/me.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { TasksModule } from "./tasks/tasks.module.js";

@Module({
  imports: [
    DbModule,
    CryptoModule,
    DataAccessModule,
    AuthModule,
    TasksModule,
    DossiersModule,
    MeModule,
    KeysModule,
    DevicesModule,
    BillingModule,
    BrainModule,
    AdminModule,
    NotificationsModule,
  ],
})
export class AppModule {}
