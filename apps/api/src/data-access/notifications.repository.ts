import { Inject, Injectable } from "@nestjs/common";
import type { NotificationType } from "@acte/contracts";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { notifications } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";

export const episodeKey = (type: string, refId: string) => `${type}:${refId}`;

/**
 * The only place that reads or writes the `notification` table. Rows carry
 * only `type` + `refId` (DATA_MODEL.md: "no free text containing client
 * data") — the message is templated at read time, in the service layer.
 * See db/schema/notification.ts for the episode model.
 */
@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Open (unresolved) episodes for this member, newest first. */
  async listOpenForMember(ctx: FirmContext, limit = 30) {
    return this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.memberId, ctx.memberId), isNull(notifications.resolvedAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /**
   * Makes the member's open episodes of `types` match exactly `activeKeys`:
   * opens an episode for each active key that has none (one INSERT … ON
   * CONFLICT DO NOTHING against the partial unique index, so concurrent
   * requests can't double-insert, and an already-read open episode stays
   * read), and resolves open episodes whose condition no longer holds.
   */
  async sync(ctx: FirmContext, types: NotificationType[], active: { type: NotificationType; refId: string }[]) {
    if (active.length > 0) {
      await this.db
        .insert(notifications)
        .values(active.map((a) => ({ firmId: ctx.firmId, memberId: ctx.memberId, type: a.type, refId: a.refId })))
        .onConflictDoNothing();
    }

    const activeKeys = new Set(active.map((a) => episodeKey(a.type, a.refId)));
    const open = await this.db
      .select({ id: notifications.id, type: notifications.type, refId: notifications.refId })
      .from(notifications)
      .where(
        and(
          eq(notifications.firmId, ctx.firmId),
          eq(notifications.memberId, ctx.memberId),
          isNull(notifications.resolvedAt),
          inArray(notifications.type, types),
        ),
      );
    const stale = open.filter((o) => !activeKeys.has(episodeKey(o.type, o.refId))).map((o) => o.id);
    if (stale.length > 0) {
      await this.db.update(notifications).set({ resolvedAt: new Date() }).where(inArray(notifications.id, stale));
    }
  }

  async markRead(ctx: FirmContext, id: string) {
    const [row] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.memberId, ctx.memberId), eq(notifications.id, id)))
      .returning();
    return row ?? null;
  }

  async markAllRead(ctx: FirmContext) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.firmId, ctx.firmId),
          eq(notifications.memberId, ctx.memberId),
          isNull(notifications.readAt),
          isNull(notifications.resolvedAt),
        ),
      );
  }
}
