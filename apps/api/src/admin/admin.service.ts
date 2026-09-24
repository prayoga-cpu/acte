import { ConflictException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { InviteMemberBody, TeamMemberSummary, UpdateMemberBody } from "@acte/contracts";
import type { z } from "zod";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { FirmsRepository } from "../data-access/firms.repository.js";
import { InvitationsRepository } from "../data-access/invitations.repository.js";
import { defaultRateCents, isPartnerRole } from "../data-access/member-defaults.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { sendInvitationEmail, sendInvitationReminderEmail, sendValidationReminderEmail } from "../email/brevo.service.js";

type MemberRow = Awaited<ReturnType<MembersRepository["listByFirmOrdered"]>>[number];
type InvitationRow = Awaited<ReturnType<InvitationsRepository["listPendingByFirm"]>>[number];

function inviteUrl(token: string): string {
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  return `${webOrigin}/invite/${encodeURIComponent(token)}`;
}

function emailUnavailable(): HttpException {
  return new HttpException(
    { error: { code: "email_unavailable", message: "The invitation email could not be sent" } },
    HttpStatus.BAD_GATEWAY,
  );
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(MembersRepository) private readonly members: MembersRepository,
    @Inject(InvitationsRepository) private readonly invitations: InvitationsRepository,
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(FirmsRepository) private readonly firms: FirmsRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
  ) {}

  private memberSummary(row: MemberRow, stats: { capturedMin: number; validatedMin: number } | undefined): TeamMemberSummary {
    const capturedMin = stats?.capturedMin ?? 0;
    const validatedMin = stats?.validatedMin ?? 0;
    return {
      id: row.id,
      firmId: row.firmId,
      email: row.email,
      displayName: row.displayName,
      initials: row.initials,
      role: row.role,
      isPartner: row.isPartner,
      isAdmin: row.isAdmin,
      hourlyRateCents: row.hourlyRateCents,
      status: row.status,
      capturedMin,
      validationRate: capturedMin > 0 ? Math.round((validatedMin / capturedMin) * 100) : 0,
      remindedAt: row.remindedAt ? row.remindedAt.toISOString() : null,
      invitationExpired: false,
    };
  }

  /** A pending invitation rendered as a team row (prototype: "Invité·e"). Its id is the invitation id. */
  private invitationSummary(inv: InvitationRow): TeamMemberSummary {
    return {
      id: inv.id,
      firmId: inv.firmId,
      email: inv.email,
      displayName: inv.email,
      initials: inv.email.slice(0, 2).toUpperCase(),
      role: inv.role,
      isPartner: isPartnerRole(inv.role),
      isAdmin: false,
      hourlyRateCents: defaultRateCents(inv.role),
      status: "invited",
      capturedMin: 0,
      validationRate: 0,
      remindedAt: null,
      invitationExpired: inv.expiresAt.getTime() <= Date.now(),
    };
  }

  private async summaryFor(ctx: FirmContext, row: MemberRow): Promise<TeamMemberSummary> {
    const stats = (await this.tasks.taskStatsByMember(ctx.firmId)).get(row.id);
    return this.memberSummary(row, stats);
  }

  async listTeam(ctx: FirmContext): Promise<TeamMemberSummary[]> {
    const [rows, pending, statsByMember] = await Promise.all([
      this.members.listByFirmOrdered(ctx.firmId),
      this.invitations.listPendingByFirm(ctx.firmId),
      this.tasks.taskStatsByMember(ctx.firmId),
    ]);
    return [...rows.map((r) => this.memberSummary(r, statsByMember.get(r.id))), ...pending.map((i) => this.invitationSummary(i))];
  }

  /**
   * Duplicate checks are firm-scoped on purpose: whether an address has an
   * ACTE account in some *other* firm is never revealed, and one firm's
   * invitation never blocks another's. An expired pending invite for the
   * same address is simply re-issued.
   */
  async invite(ctx: FirmContext, body: z.infer<typeof InviteMemberBody>): Promise<TeamMemberSummary> {
    if (await this.members.findByEmailInFirm(ctx.firmId, body.email)) {
      throw new ConflictException({ error: { code: "already_member", message: "This address is already a member of your firm" } });
    }
    const firmName = (await this.firms.findNameById(ctx.firmId)) ?? "votre cabinet";

    const existing = await this.invitations.findPendingInFirm(ctx, body.email);
    if (existing && existing.expiresAt.getTime() > Date.now()) {
      throw new ConflictException({ error: { code: "invite_pending", message: "An invitation to this address is already pending" } });
    }

    const issued = existing ? await this.invitations.reissue(ctx, existing.id, body.role) : await this.invitations.create(ctx, body);
    if (!issued) throw new NotFoundException({ error: { code: "invitation_not_found", message: "No pending invitation" } });

    try {
      await sendInvitationEmail(issued.invitation.email, inviteUrl(issued.plainToken), firmName, issued.invitation.role);
    } catch {
      if (!existing) await this.invitations.cancel(ctx, issued.invitation.id);
      throw emailUnavailable();
    }
    await this.auditLog.record(ctx, "admin.invite", "invitation", issued.invitation.id);
    return this.invitationSummary(issued.invitation);
  }

  async resendInvitation(ctx: FirmContext, invitationId: string): Promise<TeamMemberSummary> {
    const firmName = (await this.firms.findNameById(ctx.firmId)) ?? "votre cabinet";
    const reissued = await this.invitations.reissue(ctx, invitationId);
    if (!reissued) throw new NotFoundException({ error: { code: "invitation_not_found", message: "No pending invitation" } });
    try {
      await sendInvitationReminderEmail(reissued.invitation.email, inviteUrl(reissued.plainToken), firmName);
    } catch {
      throw emailUnavailable();
    }
    await this.auditLog.record(ctx, "admin.invitation.resend", "invitation", invitationId);
    return this.invitationSummary(reissued.invitation);
  }

  async cancelInvitation(ctx: FirmContext, invitationId: string): Promise<void> {
    const cancelled = await this.invitations.cancel(ctx, invitationId);
    if (!cancelled) throw new NotFoundException({ error: { code: "invitation_not_found", message: "No pending invitation" } });
    await this.auditLog.record(ctx, "admin.invitation.cancel", "invitation", invitationId);
  }

  async updateMember(ctx: FirmContext, memberId: string, body: z.infer<typeof UpdateMemberBody>): Promise<TeamMemberSummary> {
    const updated = await this.members.updateMember(ctx, memberId, body);
    if (!updated) throw new NotFoundException({ error: { code: "member_not_found", message: "Member not found" } });
    if (body.role !== undefined || body.hourlyRateCents !== undefined) {
      await this.auditLog.record(ctx, "admin.member.update", "member", memberId);
    }
    return this.summaryFor(ctx, updated);
  }

  async remindValidation(ctx: FirmContext, memberId: string): Promise<TeamMemberSummary> {
    const before = await this.members.findById(ctx.firmId, memberId);
    if (!before) throw new NotFoundException({ error: { code: "member_not_found", message: "Member not found" } });
    const updated = await this.members.markReminded(ctx, memberId);
    if (!updated) {
      throw new ConflictException({ error: { code: "already_reminded", message: "A reminder was already sent in the last 24 hours" } });
    }
    try {
      await sendValidationReminderEmail(updated.email, updated.displayName);
    } catch {
      await this.members.restoreRemindedAt(ctx, memberId, before.remindedAt);
      throw emailUnavailable();
    }
    await this.auditLog.record(ctx, "admin.member.remind", "member", memberId);
    return this.summaryFor(ctx, updated);
  }

  async suspend(ctx: FirmContext, memberId: string): Promise<TeamMemberSummary> {
    if (memberId === ctx.memberId) {
      throw new ForbiddenException({ error: { code: "cannot_suspend_self", message: "You cannot suspend your own account" } });
    }
    const updated = await this.members.suspend(ctx, memberId);
    if (!updated) throw new NotFoundException({ error: { code: "member_not_found", message: "Member not found" } });
    await this.members.revokeSessions(updated.authUserId);
    await this.auditLog.record(ctx, "admin.member.suspend", "member", memberId);
    return this.summaryFor(ctx, updated);
  }

  async reactivate(ctx: FirmContext, memberId: string): Promise<TeamMemberSummary> {
    const updated = await this.members.reactivate(ctx, memberId);
    if (!updated) throw new NotFoundException({ error: { code: "member_not_found", message: "Member not found" } });
    await this.auditLog.record(ctx, "admin.member.reactivate", "member", memberId);
    return this.summaryFor(ctx, updated);
  }
}
