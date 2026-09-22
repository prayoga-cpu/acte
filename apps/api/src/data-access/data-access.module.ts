import { Global, Module } from "@nestjs/common";
import { ActivationKeysRepository } from "./activation-keys.repository.js";
import { AuditLogRepository } from "./audit-log.repository.js";
import { ClientInvoicesRepository } from "./client-invoices.repository.js";
import { DevicesRepository } from "./devices.repository.js";
import { DossiersRepository } from "./dossiers.repository.js";
import { FirmsRepository } from "./firms.repository.js";
import { MembersRepository } from "./members.repository.js";
import { TasksRepository } from "./tasks.repository.js";

const repositories = [
  DossiersRepository,
  TasksRepository,
  MembersRepository,
  FirmsRepository,
  AuditLogRepository,
  ActivationKeysRepository,
  DevicesRepository,
  ClientInvoicesRepository,
];

@Global()
@Module({
  providers: repositories,
  exports: repositories,
})
export class DataAccessModule {}
