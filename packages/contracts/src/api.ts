import { z } from "zod";
import { Dossier } from "./entities";
import { TaskSource } from "./enums";

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

export type HomeSummary = z.infer<typeof HomeSummary>;
export type WeekSummary = z.infer<typeof WeekSummary>;
export type StatsSummary = z.infer<typeof StatsSummary>;
export type ActivationKeyCreated = z.infer<typeof ActivationKeyCreated>;
export type ActivationKeySummary = z.infer<typeof ActivationKeySummary>;
export type ClientInvoiceSummary = z.infer<typeof ClientInvoiceSummary>;
export type BrainInsight = z.infer<typeof BrainInsight>;
