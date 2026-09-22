import { Global, Module } from "@nestjs/common";
import { FirmKeyService, MASTER_KEY, masterKeyProvider } from "./firm-key.service.js";

@Global()
@Module({
  providers: [{ provide: MASTER_KEY, useFactory: masterKeyProvider }, FirmKeyService],
  exports: [MASTER_KEY, FirmKeyService],
})
export class CryptoModule {}
