import { z } from "zod";
import { TaskSource } from "./enums";

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

export const ApiError = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

export const SourceSettings = z.record(TaskSource.exclude(["manual"]), z.boolean());
