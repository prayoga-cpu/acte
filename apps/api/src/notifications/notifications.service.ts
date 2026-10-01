import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { fmtMin, type NotificationType, type NotificationView } from "@acte/contracts";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { InvitationsRepository } from "../data-access/invitations.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { NotificationsRepository } from "../data-access/notifications.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { sendAlertDigestEmail } from "../email/brevo.service.js";

/** PRODUCT_SPEC.md "Alerts": budget threshold and lag window, stage 2 rules only. */
const BUDGET_THRESHOLD_RATIO = 0.8;
const LAG_HOURS = 48;
const DIGEST_CONCURRENCY = 5;
/** Every type this service generates; `low_confidence` is stage 5 and left alone. */
const MANAGED_TYPES: NotificationType[] = ["budget", "validation_lag", "health"];

/**
 * D-005 interim (in-app only, DECISIONS.md D-014 — no external channel until
 * Yann decides). Conditions are evaluated from current state on every read
 * (no job scheduler in this stack) and synced into episodes — see
 * db/schema/notification.ts. Messages are templated from non-sensitive
 * fields only; the stored row carries no free text.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationsRepository) private readonly notifications: NotificationsRepository,
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
    @Inject(InvitationsRepository) private readonly invitations: InvitationsRepository,
  ) {}

  async list(ctx: FirmContext): Promise<NotificationView[]> {
    // Everything the rules and the templates need, loaded once per request.
    const [dossierList, usage, team, pending, statsByMember] = await Promise.all([
      this.dossiers.list(ctx),
      this.tasks.minutesByDossier(ctx.firmId),
      ctx.isAdmin ? this.members.listByFirm(ctx.firmId) : Promise.resolve([]),
      ctx.isAdmin ? this.invitations.listPendingByFirm(ctx.firmId) : Promise.resolve([]),
      ctx.isAdmin ? this.tasks.taskStatsByMember(ctx.firmId) : Promise.resolve(new Map()),
    ]);
    const dossierById = new Map(dossierList.map((d) => [d.id, d]));
    const usedByDossier = new Map(usage.map((u) => [u.dossierId, u.validatedMin]));
    const memberById = new Map(team.map((m) => [m.id, m]));
    const inviteById = new Map(pending.map((i) => [i.id, i]));
    const cutoff = Date.now() - LAG_HOURS * 60 * 60 * 1000;

    const active: { type: NotificationType; refId: string }[] = [];

    // "Dossier budget approaching limit" — lawyer and admin. Archived dossiers take no more time.
    for (const d of dossierList) {
      if (d.status === "archived" || !d.budgetMinutes) continue;
      if ((usedByDossier.get(d.id) ?? 0) / d.budgetMinutes >= BUDGET_THRESHOLD_RATIO) active.push({ type: "budget", refId: d.id });
    }

    if (ctx.isAdmin) {
      // "Team validation lagging" — admin; never about the admin's own journal.
      for (const [memberId, stat] of statsByMember as Map<string, { oldestPendingAt: string | null }>) {
        if (memberId === ctx.memberId || memberById.get(memberId)?.status === "suspended") continue;
        if (stat.oldestPendingAt && new Date(stat.oldestPendingAt).getTime() <= cutoff) {
          active.push({ type: "validation_lag", refId: memberId });
        }
      }
      // "App health: pending invites" — the stage 2 part of that row. Measured
      // from the last send (updatedAt moves on resend), so resending clears it.
      for (const inv of pending) {
        if (inv.updatedAt.getTime() <= cutoff) active.push({ type: "health", refId: inv.id });
      }
    }

    await this.notifications.sync(ctx, MANAGED_TYPES, active);
    const rows = await this.notifications.listOpenForMember(ctx);

    const views: NotificationView[] = [];
    for (const row of rows) {
      const base = {
        id: row.id,
        memberId: row.memberId,
        refId: row.refId,
        type: row.type,
        createdAt: row.createdAt.toISOString(),
        readAt: row.readAt ? row.readAt.toISOString() : null,
      };
      if (row.type === "budget") {
        const d = dossierById.get(row.refId);
        if (!d?.budgetMinutes) continue;
        const used = usedByDossier.get(row.refId) ?? 0;
        const pct = Math.round((used / d.budgetMinutes) * 100);
        views.push({ ...base, message: `Dossier « ${d.name} » à ${pct} % du budget (${fmtMin(used)} / ${fmtMin(d.budgetMinutes)}).` });
      } else if (row.type === "validation_lag") {
        const m = memberById.get(row.refId);
        if (!m) continue;
        views.push({ ...base, message: `${m.displayName} n'a pas validé son Journal depuis plus de ${LAG_HOURS} h.` });
      } else if (row.type === "health") {
        const inv = inviteById.get(row.refId);
        if (!inv) continue;
        const state = inv.expiresAt.getTime() <= Date.now() ? "a expiré" : `est en attente depuis plus de ${LAG_HOURS} h`;
        views.push({ ...base, message: `L'invitation de ${inv.email} ${state} — renvoyez-la depuis la console admin.` });
      }
    }
    return views;
  }

  /**
   * D-005 interim (D-019): one email per member with alerts they haven't
   * read and haven't been emailed about. The email carries counts by kind
   * and a link — never the alert text, which names dossiers and colleagues.
   * Run by the scheduled job (see DigestController); each episode is emailed
   * at most once, and only marked as emailed when the send succeeded.
   */
  async sendDigests(): Promise<{ recipients: number; sent: number; failed: number }> {
    const dashboardUrl = `${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/dashboard`;
    const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
    const recipients = await this.members.listDigestRecipients();
    let sent = 0;
    let failed = 0;

    const sendOne = async (member: (typeof recipients)[number]) => {
      const ctx: FirmContext = { firmId: member.firmId, memberId: member.id, isAdmin: member.isAdmin };
      try {
        await this.list(ctx); // evaluates the rules and syncs this member's episodes
        const pending = await this.notifications.listForDigest(ctx);
        if (pending.length === 0) return;

        const count = (type: NotificationType) => pending.filter((p) => p.type === type).length;
        const lines = [
          count("budget") ? plural(count("budget"), "dossier proche de son budget d'heures", "dossiers proches de leur budget d'heures") : null,
          count("validation_lag")
            ? plural(count("validation_lag"), "membre avec des temps en attente depuis plus de 48 h", "membres avec des temps en attente depuis plus de 48 h")
            : null,
          count("health") ? plural(count("health"), "invitation sans réponse", "invitations sans réponse") : null,
        ].filter((l): l is string => l !== null);
        if (lines.length === 0) return;

        await sendAlertDigestEmail(member.email, member.displayName, lines, dashboardUrl);
        await this.notifications.markEmailed(ctx, pending.map((p) => p.id));
        sent += 1;
      } catch {
        failed += 1;
      }
    };

    // A few members at a time: one request has to get through everyone before the host's function timeout.
    for (let i = 0; i < recipients.length; i += DIGEST_CONCURRENCY) {
      await Promise.all(recipients.slice(i, i + DIGEST_CONCURRENCY).map(sendOne));
    }
    return { recipients: recipients.length, sent, failed };
  }

  async markRead(ctx: FirmContext, id: string): Promise<void> {
    const row = await this.notifications.markRead(ctx, id);
    if (!row) throw new NotFoundException({ error: { code: "notification_not_found", message: "Notification not found" } });
  }

  async markAllRead(ctx: FirmContext): Promise<void> {
    await this.notifications.markAllRead(ctx);
  }
}
