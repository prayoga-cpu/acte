import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { fmtMin, type NotificationType, type NotificationView } from "@acte/contracts";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { InvitationsRepository } from "../data-access/invitations.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { NotificationsRepository } from "../data-access/notifications.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

/** PRODUCT_SPEC.md "Alerts": budget threshold and lag window, stage 2 rules only. */
const BUDGET_THRESHOLD_RATIO = 0.8;
const LAG_HOURS = 48;
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

  async markRead(ctx: FirmContext, id: string): Promise<void> {
    const row = await this.notifications.markRead(ctx, id);
    if (!row) throw new NotFoundException({ error: { code: "notification_not_found", message: "Notification not found" } });
  }

  async markAllRead(ctx: FirmContext): Promise<void> {
    await this.notifications.markAllRead(ctx);
  }
}
