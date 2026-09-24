import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AcceptInvitationBody, InvitationPreview } from "@acte/contracts";
import type { z } from "zod";
import { auth } from "../auth/auth.config.js";
import { invitationAcceptance } from "../auth/invitation-context.js";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { FirmsRepository } from "../data-access/firms.repository.js";
import { InvitationsRepository } from "../data-access/invitations.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";

const notFound = () =>
  new NotFoundException({ error: { code: "invitation_not_found", message: "Invitation not found, already used or expired" } });

/**
 * The public, token-gated side of invitations (D-014). Holding the emailed
 * token is the only way into an existing firm: accept() creates the account
 * for the invitation's own address (never one the client supplies) and binds
 * it to that invitation's firm by id.
 */
@Injectable()
export class InvitationsService {
  constructor(
    @Inject(InvitationsRepository) private readonly invitations: InvitationsRepository,
    @Inject(FirmsRepository) private readonly firms: FirmsRepository,
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
  ) {}

  async preview(token: string): Promise<InvitationPreview> {
    const inv = await this.invitations.findUsableByToken(token);
    if (!inv) throw notFound();
    const firmName = (await this.firms.findNameById(inv.firmId)) ?? "ce cabinet";
    return { email: inv.email, firmName, role: inv.role };
  }

  /** Returns the Set-Cookie headers of the new session, for the controller to forward. */
  async accept(token: string, body: z.infer<typeof AcceptInvitationBody>): Promise<{ setCookies: string[] }> {
    const inv = await this.invitations.findUsableByToken(token);
    if (!inv) throw notFound();

    // The signup hook sees this context and does NOT mint a new firm for the user.
    const res = await invitationAcceptance.run({ invitationId: inv.id }, () =>
      auth.api.signUpEmail({ body: { email: inv.email, password: body.password, name: body.name }, asResponse: true }),
    );

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
      if (err?.code === "USER_ALREADY_EXISTS" || err?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        throw new ConflictException({ error: { code: "account_exists", message: "An ACTE account already exists for this address" } });
      }
      throw new BadRequestException({ error: { code: "signup_failed", message: err?.message ?? "Could not create the account" } });
    }

    const created = (await res.json()) as { user: { id: string } };
    let member: Awaited<ReturnType<InvitationsRepository["accept"]>>;
    try {
      member = await this.invitations.accept(token, created.user.id, body.name);
    } catch (err) {
      await this.members.deleteAuthUser(created.user.id);
      throw err;
    }
    if (!member) {
      // Accepted or expired in between (double submit, race) — undo the account we just made.
      await this.members.deleteAuthUser(created.user.id);
      throw notFound();
    }

    await this.auditLog.record({ firmId: member.firmId, memberId: member.id, isAdmin: false }, "invitation.accept", "member", member.id);
    return { setCookies: res.headers.getSetCookie() };
  }
}
