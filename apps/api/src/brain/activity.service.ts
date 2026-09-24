import { Inject, Injectable } from "@nestjs/common";
import type { ActivityEntry } from "@acte/contracts";
import { AuditLogRepository } from "../data-access/audit-log.repository.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

type Template = (actor: string, target: string) => string;

/** The only actions the feed renders — also the SQL filter, so the two can't drift apart. */
const TEMPLATES: Record<string, Template> = {
  "task.validate": (a) => `${a} · tâche validée au journal.`,
  "task.validate_all": (a) => `${a} · toutes les tâches en attente validées.`,
  "task.reassign": (a) => `${a} · tâche réassociée à un autre dossier.`,
  "dossier.create": (a, t) => `${a} · dossier « ${t} » créé.`,
  "dossier.update": (a, t) => `${a} · dossier « ${t} » mis à jour.`,
  "dossier.archive": (a, t) => `${a} · dossier « ${t} » archivé.`,
  "invoice.draft": (a) => `${a} · brouillon de facture généré.`,
  "admin.invite": (a) => `${a} · invitation envoyée.`,
  "admin.invitation.resend": (a) => `${a} · invitation renvoyée.`,
  "admin.invitation.cancel": (a) => `${a} · invitation annulée.`,
  "invitation.accept": (a) => `${a} · a rejoint le cabinet.`,
  "admin.member.update": (a, t) => `${a} · profil de ${t} mis à jour.`,
  "admin.member.remind": (a, t) => `${a} · rappel de validation envoyé à ${t}.`,
  "admin.member.suspend": (a, t) => `${a} · compte de ${t} suspendu.`,
  "admin.member.reactivate": (a, t) => `${a} · compte de ${t} réactivé.`,
};

/**
 * Brain panel activity feed from the audit log (PROTOTYPE_MAP.md, stage 2).
 * Visibility is decided in SQL by AuditLogRepository.listActivity. Targets
 * are rendered by display name (members) or dossier name (dossiers, same
 * firm, same as the Dossiers view shows); invitations are never named.
 */
@Injectable()
export class ActivityService {
  constructor(
    @Inject(AuditLogRepository) private readonly auditLog: AuditLogRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
  ) {}

  async list(ctx: FirmContext): Promise<ActivityEntry[]> {
    const [rows, team, dossierList] = await Promise.all([
      this.auditLog.listActivity(ctx, Object.keys(TEMPLATES), 20),
      this.members.listByFirm(ctx.firmId),
      this.dossiers.list(ctx),
    ]);
    const memberName = new Map(team.map((m) => [m.id, m.displayName]));
    const dossierName = new Map(dossierList.map((d) => [d.id, d.name]));

    return rows.map((r) => {
      const actor = r.actorMemberId === ctx.memberId ? "Vous" : (memberName.get(r.actorMemberId) ?? "Un membre");
      const target =
        (r.targetId && (r.targetType === "member" ? memberName.get(r.targetId) : r.targetType === "dossier" ? dossierName.get(r.targetId) : undefined)) ||
        "—";
      return { id: r.id, message: TEMPLATES[r.action]!(actor, target), createdAt: r.createdAt.toISOString() };
    });
  }
}
