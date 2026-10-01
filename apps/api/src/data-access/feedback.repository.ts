import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import type { FeedbackCategory, FeedbackEntry } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { feedback, members } from "../db/schema/index.js";
import { decryptField, encryptField } from "../crypto/field-encryption.js";
import { FirmKeyService } from "../crypto/firm-key.service.js";
import type { FirmContext } from "./firm-context.js";

/** The only place that reads or writes `feedback`. The message is free text, so it is field-encrypted. */
@Injectable()
export class FeedbackRepository {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(FirmKeyService) private readonly firmKeys: FirmKeyService,
  ) {}

  async create(ctx: FirmContext, input: { category: FeedbackCategory; message: string }): Promise<{ id: string }> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .insert(feedback)
      .values({ firmId: ctx.firmId, memberId: ctx.memberId, category: input.category, message: encryptField(input.message, dataKey) })
      .returning({ id: feedback.id });
    return row!;
  }

  async listByFirm(ctx: FirmContext, limit = 50): Promise<FeedbackEntry[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db
      .select({ entry: feedback, authorName: members.displayName })
      .from(feedback)
      .innerJoin(members, eq(feedback.memberId, members.id))
      .where(eq(feedback.firmId, ctx.firmId))
      .orderBy(desc(feedback.createdAt))
      .limit(limit);
    return rows.map(({ entry, authorName }) => ({
      id: entry.id,
      category: entry.category,
      message: decryptField(entry.message, dataKey),
      authorName,
      createdAt: entry.createdAt.toISOString(),
    }));
  }
}
