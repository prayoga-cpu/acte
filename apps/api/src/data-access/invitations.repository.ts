import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { MemberRole } from "@acte/contracts";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { invitations, members, user } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";
import { defaultRateCents, initialsOf, isPartnerRole } from "./member-defaults.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newToken() {
  const plainToken = randomBytes(32).toString("base64url");
  return { plainToken, tokenHash: hashToken(plainToken), expiresAt: new Date(Date.now() + INVITE_TTL_MS) };
}

/**
 * The only place that reads or writes `invitation`. Admin-side methods are
 * scoped to ctx.firmId; the two token methods are the public, token-gated
 * entry points (preview and accept) and look up by token hash only.
 */
@Injectable()
export class InvitationsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Pending (not yet accepted) invite for this email in the caller's firm, expired or not. */
  async findPendingInFirm(ctx: FirmContext, email: string) {
    const [row] = await this.db
      .select()
      .from(invitations)
      .where(and(eq(invitations.firmId, ctx.firmId), eq(invitations.email, email.toLowerCase()), isNull(invitations.acceptedAt)));
    return row ?? null;
  }

  async listPendingByFirm(firmId: string) {
    return this.db
      .select()
      .from(invitations)
      .where(and(eq(invitations.firmId, firmId), isNull(invitations.acceptedAt)))
      .orderBy(asc(invitations.createdAt), asc(invitations.id));
  }

  async create(ctx: FirmContext, input: { email: string; role: MemberRole }) {
    const { plainToken, tokenHash, expiresAt } = newToken();
    const [row] = await this.db
      .insert(invitations)
      .values({
        firmId: ctx.firmId,
        email: input.email.toLowerCase(),
        role: input.role,
        tokenHash,
        expiresAt,
        invitedByMemberId: ctx.memberId,
      })
      .returning();
    return { invitation: row!, plainToken };
  }

  /** New token + fresh expiry (the old link stops working). Optionally updates the role. */
  async reissue(ctx: FirmContext, id: string, role?: MemberRole) {
    const { plainToken, tokenHash, expiresAt } = newToken();
    const [row] = await this.db
      .update(invitations)
      .set({ tokenHash, expiresAt, ...(role ? { role } : {}) })
      .where(and(eq(invitations.firmId, ctx.firmId), eq(invitations.id, id), isNull(invitations.acceptedAt)))
      .returning();
    return row ? { invitation: row, plainToken } : null;
  }

  async cancel(ctx: FirmContext, id: string) {
    const [row] = await this.db
      .delete(invitations)
      .where(and(eq(invitations.firmId, ctx.firmId), eq(invitations.id, id), isNull(invitations.acceptedAt)))
      .returning();
    return row ?? null;
  }

  /** Public, token-gated lookup (preview + accept). Pending and unexpired only. */
  async findUsableByToken(token: string) {
    const [row] = await this.db
      .select()
      .from(invitations)
      .where(and(eq(invitations.tokenHash, hashToken(token)), isNull(invitations.acceptedAt), gt(invitations.expiresAt, new Date())));
    return row ?? null;
  }

  /**
   * Turns a usable invitation into a member of that firm, bound to the auth
   * user just created for the invite's own email, in one transaction. The
   * UPDATE re-checks "still pending and unexpired", so a double submit or
   * a race can accept an invitation at most once. Receiving the emailed
   * token proves the invitee controls the inbox, so the account is marked
   * email-verified.
   */
  async accept(token: string, authUserId: string, displayName: string) {
    return this.db.transaction(async (tx) => {
      // By token hash, not id: a resend (new token) during an accept with the old link makes this match nothing.
      const [inv] = await tx
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(and(eq(invitations.tokenHash, hashToken(token)), isNull(invitations.acceptedAt), gt(invitations.expiresAt, new Date())))
        .returning();
      if (!inv) return null;

      const [member] = await tx
        .insert(members)
        .values({
          firmId: inv.firmId,
          authUserId,
          email: inv.email,
          displayName,
          initials: initialsOf(displayName),
          role: inv.role,
          isPartner: isPartnerRole(inv.role),
          isAdmin: false,
          hourlyRateCents: defaultRateCents(inv.role),
          status: "active",
        })
        .returning();

      await tx.update(user).set({ emailVerified: true }).where(eq(user.id, authUserId));
      return member!;
    });
  }
}
