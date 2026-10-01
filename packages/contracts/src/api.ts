import { z } from "zod";
import { Dossier, Member, Notification } from "./entities";
import { DossierStatus, MemberRole, TaskSource, TaskStatus } from "./enums";

const id = z.string().uuid();
const ts = z.string().datetime();

export const CreateManualTaskBody = z.object({
  dossierId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  startedAt: z.string().datetime(),
  durationMin: z.number().int().positive().max(24 * 60),
}).strict();

/**
 * PATCH /v1/tasks/:id. `dossierId` reassigns the task (and logs a
 * correction); the other fields edit a still-pending task. At least one
 * field is required.
 */
export const UpdateTaskBody = z
  .object({
    dossierId: z.string().uuid().optional(),
    title: z.string().min(1).max(200).optional(),
    startedAt: z.string().datetime().optional(),
    durationMin: z.number().int().positive().max(24 * 60).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });

/** POST /v1/tasks/validate-all — exactly the tasks the Journal is showing, never "everything pending". */
export const ValidateTasksBody = z.object({ taskIds: z.array(z.string().uuid()).min(1).max(500) }).strict();

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
  /** Validated minutes, all time — what the budget bar and the budget alert measure. */
  usedMinutes: z.number().int(),
  pendingMinutes: z.number().int(),
  /** Validated minutes in the current Paris month — the "ce mois-ci" figures. */
  monthMinutes: z.number().int(),
  /** Validated minutes not yet on an invoice draft — what "Générer la facture" would bill. */
  uninvoicedMinutes: z.number().int(),
});
export type DossierUsage = z.infer<typeof DossierUsage>;

export const UpdateDossierBody = z.object({
  name: z.string().min(1).max(160).optional(),
  clientLabel: z.string().max(160).optional(),
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
  /** Validated minutes by source, current Paris month. */
  sourceBreakdown: z.array(z.object({ source: TaskSource, minutes: z.number().int() })),
  /** Every non-discarded minute logged this month, and the share of it on billable dossiers (0–100). */
  capturedMonthMin: z.number().int(),
  billableMonthPct: z.number().int().min(0).max(100),
  /** Profile & Impact "temps forts du mois" — the member's own data only. */
  highlights: z.object({
    bestDay: z.object({ date: z.string(), minutes: z.number().int() }).nullable(),
    topDossier: z.object({ name: z.string(), pct: z.number().int().min(0).max(100) }).nullable(),
    shortTasksCount: z.number().int(),
  }),
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
  createdAt: ts,
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
  /** D-004 interim (D-019): an admin may grant or remove admin rights; the last admin can't be removed. */
  isAdmin: z.boolean().optional(),
}).strict();

/** PATCH /v1/firm — admin only. */
export const UpdateFirmBody = z.object({ name: z.string().trim().min(1).max(120) }).strict();
export const FirmRenamed = z.object({ name: z.string() }).strict();

/**
 * GET /v1/exports/my-data.json — the member's own tasks and the dossiers
 * they point to (Cloud & Sync « Exporter mes données »). Strict at every
 * level: nothing else — another member's data, an internal id — can ride along.
 */
export const MyDataExport = z.object({
  exportedAt: ts,
  member: z.object({
    displayName: z.string(), email: z.string().email(), role: MemberRole, hourlyRateCents: z.number().int().nonnegative(),
  }).strict().nullable(),
  tasks: z.array(z.object({
    title: z.string(),
    dossier: z.string().nullable(),
    source: TaskSource,
    startedAt: ts, endedAt: ts,
    durationMin: z.number().int().positive(),
    status: TaskStatus,
    validatedAt: ts.nullable(),
    rateCents: z.number().int().nonnegative().nullable(),
  }).strict()),
  dossiers: z.array(z.object({
    name: z.string(), clientLabel: z.string(), status: DossierStatus, budgetMinutes: z.number().int().positive().nullable(),
  }).strict()),
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
export const ThemePreference = z.enum(["dark", "light"]);
export const MemberProfile = Member.extend({
  firmName: z.string(),
  theme: ThemePreference,
  /** D-005 interim (D-019): daily email digest of open alerts, on by default. */
  alertEmails: z.boolean(),
});

/** PATCH /v1/me/preferences. */
export const UpdatePreferencesBody = z
  .object({ theme: ThemePreference.optional(), alertEmails: z.boolean().optional() })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });

/** Feedback to the ACTE team (stage 6, built early under D-019). The message is stored field-encrypted. */
export const FeedbackCategory = z.enum(["bug", "idea", "other"]);
export const FeedbackBody = z.object({ category: FeedbackCategory, message: z.string().trim().min(1).max(2000) }).strict();
export const FeedbackCreated = z.object({ id }).strict();
export const FeedbackEntry = z.object({
  id, category: FeedbackCategory, message: z.string(), authorName: z.string(), createdAt: ts,
});

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

export type UpdateTaskBody = z.infer<typeof UpdateTaskBody>;
export type ValidateTasksBody = z.infer<typeof ValidateTasksBody>;
export type ThemePreference = z.infer<typeof ThemePreference>;
export type UpdatePreferencesBody = z.infer<typeof UpdatePreferencesBody>;
export type FeedbackCategory = z.infer<typeof FeedbackCategory>;
export type FeedbackBody = z.infer<typeof FeedbackBody>;
export type FeedbackEntry = z.infer<typeof FeedbackEntry>;
export type MyDataExport = z.infer<typeof MyDataExport>;
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
