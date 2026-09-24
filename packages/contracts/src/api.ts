import { z } from "zod";
import { Dossier, Member, Notification } from "./entities";
import { MemberRole, TaskSource } from "./enums";

const id = z.string().uuid();
const ts = z.string().datetime();

export const CreateManualTaskBody = z.object({
  dossierId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  startedAt: z.string().datetime(),
  durationMin: z.number().int().positive().max(24 * 60),
}).strict();

export const ReassignTaskBody = z.object({ dossierId: z.string().uuid() }).strict();

export const CreateDossierBody = z.object({
  name: z.string().min(1).max(160),
  clientLabel: z.string().max(160),
  budgetMinutes: z.number().int().positive().nullable(),
}).strict();

export const GenerateInvoiceBody = z.object({ dossierId: z.string().uuid() }).strict();

/**
 * Dossier + its computed usage (docs/02-architecture/DATA_MODEL.md
 * "Computed, not stored"). Firm-wide, not member-scoped — a dossier-level
 * total is an aggregate, not another member's task detail.
 */
export const DossierUsage = Dossier.extend({
  usedMinutes: z.number().int(),
  pendingMinutes: z.number().int(),
});
export type DossierUsage = z.infer<typeof DossierUsage>;

export const UpdateDossierBody = z.object({
  budgetMinutes: z.number().int().positive().nullable().optional(),
  status: z.enum(["progress", "ready", "archived"]).optional(),
}).strict();

export const HomeSummary = z.object({
  capturedTodayMin: z.number().int(),
  validatedTodayMin: z.number().int(),
  pendingTodayMin: z.number().int(),
  securedRevenueMonthCents: z.number().int(),
  averageRateCents: z.number().int(),
  roiMinutesToday: z.number().int(),
});

export const WeekSummary = z.object({
  days: z.array(z.object({ label: z.string(), minutes: z.number().int() })).length(7),
  totalMin: z.number().int(),
});

/** Monthly secured-revenue trend and per-source breakdown (Stats view, stage 2). */
export const StatsSummary = z.object({
  months: z.array(z.object({ label: z.string(), revenueCents: z.number().int() })),
  sourceBreakdown: z.array(z.object({ source: TaskSource, minutes: z.number().int() })),
});

export const ActivationKeyCreated = z.object({
  id, prefix: z.string(), plainKey: z.string(),
});
export const ActivationKeySummary = z.object({
  id, prefix: z.string(), createdAt: ts, revokedAt: ts.nullable(),
});

export const ClientInvoiceSummary = z.object({
  id, dossierId: id, dossierName: z.string(), number: z.string(),
  periodLabel: z.string(), minutes: z.number().int(), amountCents: z.number().int(),
  status: z.enum(["draft", "issued"]),
});

/** Deterministic templated insight — "Le Cerveau d'ACTE" panel, no LLM before stage 5. */
export const BrainInsight = z.object({
  id: z.string(), message: z.string(), createdAt: ts,
});

export const ApiError = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

export const SourceSettings = z.record(TaskSource.exclude(["manual"]), z.boolean());

/**
 * Admin console team table (D-004: role-gated, server-enforced — see
 * AdminGuard). Extends Member with the per-member stats the prototype's
 * "Équipe du cabinet" table shows, computed the same way DossierUsage
 * computes usage: joined from tasks at read time, not stored.
 */
export const TeamMemberSummary = Member.extend({
  capturedMin: z.number().int(),
  validationRate: z.number().int().min(0).max(100),
  remindedAt: z.string().datetime().nullable(),
  /** Only meaningful for status "invited" rows, whose `id` is the invitation id, not a member id. */
  invitationExpired: z.boolean(),
});

export const InviteMemberBody = z.object({
  email: z.string().email(),
  role: MemberRole,
}).strict();

export const UpdateMemberBody = z.object({
  role: MemberRole.optional(),
  hourlyRateCents: z.number().int().min(0).max(5_000_00).optional(),
}).strict();

/**
 * Accepting an invitation (public, token-gated). No email field on purpose:
 * the account is created for the invitation's own address, so the only way
 * to join a firm is to hold the emailed token.
 */
export const AcceptInvitationBody = z.object({
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
}).strict();

/** GET /v1/me/profile — the member plus their firm's (decrypted) name, e.g. for the admin console heading. */
export const MemberProfile = Member.extend({ firmName: z.string() });

/** Public preview for the invite-acceptance page — token-gated, no session required. */
export const InvitationPreview = z.object({
  email: z.string().email(),
  firmName: z.string(),
  role: MemberRole,
});

/**
 * D-005 interim (in-app only). The stored row is just type + refId
 * (DATA_MODEL.md: no free text with client data) — `message` is templated
 * server-side at read time, same pattern as BrainInsight.
 */
export const NotificationView = Notification.extend({ message: z.string() });

/**
 * Brain panel activity feed (PROTOTYPE_MAP.md: "Activity feed from audit
 * log"). Templated from fixed action strings + a target's display name —
 * never a task title (PRIVACY_MODEL rule 4).
 */
export const ActivityEntry = z.object({ id, message: z.string(), createdAt: ts });

export type HomeSummary = z.infer<typeof HomeSummary>;
export type WeekSummary = z.infer<typeof WeekSummary>;
export type StatsSummary = z.infer<typeof StatsSummary>;
export type ActivationKeyCreated = z.infer<typeof ActivationKeyCreated>;
export type ActivationKeySummary = z.infer<typeof ActivationKeySummary>;
export type ClientInvoiceSummary = z.infer<typeof ClientInvoiceSummary>;
export type BrainInsight = z.infer<typeof BrainInsight>;
export type SourceSettings = z.infer<typeof SourceSettings>;
export type TeamMemberSummary = z.infer<typeof TeamMemberSummary>;
export type InvitationPreview = z.infer<typeof InvitationPreview>;
export type MemberProfile = z.infer<typeof MemberProfile>;
export type NotificationView = z.infer<typeof NotificationView>;
export type ActivityEntry = z.infer<typeof ActivityEntry>;
