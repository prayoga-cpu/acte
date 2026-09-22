import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { auditLogs } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";

/**
 * apps/api/CLAUDE.md: "Every admin action and every validation writes to audit_log."
 * Never store P0/P1 values here — `action`/`targetType` are fixed strings, `targetId`
 * is an id, nothing else.
 */
@Injectable()
export class AuditLogRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async record(ctx: FirmContext, action: string, targetType: string, targetId: string | null): Promise<void> {
    await this.db.insert(auditLogs).values({
      firmId: ctx.firmId,
      actorMemberId: ctx.memberId,
      action,
      targetType,
      targetId,
    });
  }

  async listForFirm(firmId: string, limit = 50) {
    return this.db.select().from(auditLogs).where(eq(auditLogs.firmId, firmId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
}
