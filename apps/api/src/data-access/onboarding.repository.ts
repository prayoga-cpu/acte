import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, ne } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { dossiers, invitations, members, tasks } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";

/**
 * The reads and the one write behind the first-run welcome and the
 * "Premiers pas" checklist (D-021). Every query is scoped to `ctx.firmId`
 * and selects ids, a rate and a timestamp only — never an encrypted column,
 * so nothing here needs the firm key and no name can leave through it.
 */
@Injectable()
export class OnboardingRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findOwn(ctx: FirmContext): Promise<{ onboardedAt: Date | null; hourlyRateCents: number } | null> {
    const [row] = await this.db
      .select({ onboardedAt: members.onboardedAt, hourlyRateCents: members.hourlyRateCents })
      .from(members)
      .where(and(eq(members.firmId, ctx.firmId), eq(members.id, ctx.memberId)));
    return row ?? null;
  }

  /** Stamps the first time only: a second call keeps the original date. */
  async markOnboarded(ctx: FirmContext): Promise<void> {
    await this.db
      .update(members)
      .set({ onboardedAt: new Date() })
      .where(and(eq(members.firmId, ctx.firmId), eq(members.id, ctx.memberId), isNull(members.onboardedAt)));
  }

  /** Firm-wide, like the Dossiers view: any member sees the firm's dossiers. */
  async hasDossier(ctx: FirmContext): Promise<boolean> {
    const rows = await this.db.select({ id: dossiers.id }).from(dossiers).where(eq(dossiers.firmId, ctx.firmId)).limit(1);
    return rows.length > 0;
  }

  /** The member's own tasks only (PRIVACY_MODEL rule 4), any day. */
  async ownTaskFlags(ctx: FirmContext): Promise<{ hasTask: boolean; hasValidatedTask: boolean }> {
    const own = and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId));
    const [anyTask, validated] = await Promise.all([
      this.db.select({ id: tasks.id }).from(tasks).where(own).limit(1),
      this.db.select({ id: tasks.id }).from(tasks).where(and(own, eq(tasks.status, "validated"))).limit(1),
    ]);
    return { hasTask: anyTask.length > 0, hasValidatedTask: validated.length > 0 };
  }

  /** Another member in the firm, or an invitation still awaiting an answer. Call for admins only. */
  async hasOtherMemberOrInvitation(ctx: FirmContext): Promise<boolean> {
    const [others, pending] = await Promise.all([
      this.db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.firmId, ctx.firmId), ne(members.id, ctx.memberId)))
        .limit(1),
      this.db
        .select({ id: invitations.id })
        .from(invitations)
        .where(and(eq(invitations.firmId, ctx.firmId), isNull(invitations.acceptedAt)))
        .limit(1),
    ]);
    return others.length > 0 || pending.length > 0;
  }
}
