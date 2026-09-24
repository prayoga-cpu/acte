import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, isNull, lt, or } from "drizzle-orm";
import type { MemberRole, MemberStatus } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { members, session, user } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";
import { initialsOf, isPartnerRole } from "./member-defaults.js";

/** A second "Rappeler la validation" within this window is refused rather than re-sending the email. */
export const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MembersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Creates the firm-founding member: partner, admin, on first signup. */
  async createFounder(input: { authUserId: string; email: string; displayName: string; firmId: string }) {
    const [row] = await this.db
      .insert(members)
      .values({
        firmId: input.firmId,
        authUserId: input.authUserId,
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        initials: initialsOf(input.displayName),
        role: "associe",
        isPartner: true,
        isAdmin: true,
        status: "active",
      })
      .returning();
    return row;
  }

  async findByAuthUserId(authUserId: string) {
    const [row] = await this.db.select().from(members).where(eq(members.authUserId, authUserId));
    return row ?? null;
  }

  /** A suspended member resolves to no context — suspension revokes access, it doesn't just relabel the row. */
  async toFirmContext(authUserId: string): Promise<FirmContext | null> {
    const member = await this.findByAuthUserId(authUserId);
    if (!member || member.status === "suspended" || member.status === "invited") return null;
    return { firmId: member.firmId, memberId: member.id, isAdmin: member.isAdmin };
  }

  /** Firm-scoped: is this address already a member of the caller's own firm? Never answers for other firms. */
  async findByEmailInFirm(firmId: string, email: string) {
    const [row] = await this.db
      .select()
      .from(members)
      .where(and(eq(members.firmId, firmId), eq(members.email, email.toLowerCase())));
    return row ?? null;
  }

  async listByFirm(firmId: string) {
    return this.db.select().from(members).where(eq(members.firmId, firmId));
  }

  async findById(firmId: string, memberId: string) {
    const [row] = await this.db
      .select()
      .from(members)
      .where(and(eq(members.firmId, firmId), eq(members.id, memberId)));
    return row ?? null;
  }

  async updateSourceSettings(memberId: string, settings: Record<string, boolean>) {
    const [row] = await this.db.update(members).set({ sourceSettings: settings }).where(eq(members.id, memberId)).returning();
    return row ?? null;
  }

  /** Admin console team table. createdAt never changes, so rows keep their position across edits. */
  async listByFirmOrdered(firmId: string) {
    return this.db
      .select()
      .from(members)
      .where(eq(members.firmId, firmId))
      .orderBy(asc(members.createdAt), asc(members.id));
  }

  /** The partner flag follows the role, so a role change recomputes it. An empty patch is a no-op, not a 500. */
  async updateMember(ctx: FirmContext, memberId: string, patch: { role?: MemberRole; hourlyRateCents?: number }) {
    const set = {
      ...(patch.hourlyRateCents !== undefined ? { hourlyRateCents: patch.hourlyRateCents } : {}),
      ...(patch.role !== undefined ? { role: patch.role, isPartner: isPartnerRole(patch.role) } : {}),
    };
    if (Object.keys(set).length === 0) return this.findById(ctx.firmId, memberId);
    const [row] = await this.db
      .update(members)
      .set(set)
      .where(and(eq(members.firmId, ctx.firmId), eq(members.id, memberId)))
      .returning();
    return row ?? null;
  }

  async suspend(ctx: FirmContext, memberId: string) {
    const [row] = await this.db
      .update(members)
      .set({ status: "suspended" })
      .where(and(eq(members.firmId, ctx.firmId), eq(members.id, memberId)))
      .returning();
    return row ?? null;
  }

  async reactivate(ctx: FirmContext, memberId: string) {
    const [row] = await this.db
      .update(members)
      .set({ status: "active" })
      .where(and(eq(members.firmId, ctx.firmId), eq(members.id, memberId), eq(members.status, "suspended")))
      .returning();
    return row ?? null;
  }

  /** Ends every better-auth session of this account, so a suspension bites in open tabs too, not just at next login. */
  async revokeSessions(authUserId: string) {
    await this.db.delete(session).where(eq(session.userId, authUserId));
  }

  /** Compensating delete for an auth account whose firm binding failed (sessions/accounts cascade). */
  async deleteAuthUser(authUserId: string) {
    await this.db.delete(user).where(eq(user.id, authUserId));
  }

  /**
   * "Rappeler la validation" — stamps remindedAt, but only if no reminder
   * went out in the last 24 h (enforced in the UPDATE itself, so rapid or
   * concurrent clicks can't send the email twice). Null = not updated.
   */
  async markReminded(ctx: FirmContext, memberId: string) {
    const [row] = await this.db
      .update(members)
      .set({ remindedAt: new Date() })
      .where(
        and(
          eq(members.firmId, ctx.firmId),
          eq(members.id, memberId),
          or(isNull(members.remindedAt), lt(members.remindedAt, new Date(Date.now() - REMINDER_COOLDOWN_MS))),
        ),
      )
      .returning();
    return row ?? null;
  }

  /** Undo a reminder stamp when the email behind it could not be sent — otherwise the cooldown would block the retry. */
  async restoreRemindedAt(ctx: FirmContext, memberId: string, previous: Date | null) {
    await this.db
      .update(members)
      .set({ remindedAt: previous })
      .where(and(eq(members.firmId, ctx.firmId), eq(members.id, memberId)));
  }

  async insertDemoMember(input: {
    authUserId: string;
    email: string;
    displayName: string;
    firmId: string;
    role: MemberRole;
    isPartner: boolean;
    status: MemberStatus;
    hourlyRateCents: number;
  }) {
    const [row] = await this.db
      .insert(members)
      .values({
        firmId: input.firmId,
        authUserId: input.authUserId,
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        initials: initialsOf(input.displayName),
        role: input.role,
        isPartner: input.isPartner,
        isAdmin: false,
        status: input.status,
        hourlyRateCents: input.hourlyRateCents,
      })
      .returning();
    return row;
  }
}
