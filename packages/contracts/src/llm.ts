import { z } from "zod";
import { DossierStatus } from "./enums";

/**
 * "Le Cerveau d'ACTE" chat (D-015). The browser sends the member's question
 * and the last few turns; the API answers from the member's own aggregates.
 */
/**
 * Turns go up whole: the API truncates them to 1000 characters only after
 * pseudonymizing, so a cut can never split a dossier name out of reach of
 * the masks.
 */
export const ChatTurn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
}).strict();

export const ChatRequest = z.object({
  message: z.string().trim().min(1).max(500),
  history: z.array(ChatTurn).max(8).default([]),
}).strict();

/**
 * `reply` is what the member sees, with dossier names restored. `history` is
 * the same reply as the model wrote it — refs, no names — which the panel
 * sends back as the assistant turn, so restored names never go round again.
 */
export const ChatReply = z.object({ reply: z.string().min(1), history: z.string().min(1) });

/** A duration already split for display, so the model never has to divide by 60. */
const Duration = z.object({ h: z.number().int().nonnegative(), min: z.number().int().min(0).max(59) }).strict();

/**
 * Everything the API may send to the LLM provider as data (D-015,
 * PRIVACY_MODEL.md). An allowlist in the same spirit as IngestActivity:
 * numbers, booleans, enums and opaque dossier references only. There is no
 * free-text field, so a dossier name, client label or task title (P2) has
 * nowhere to go — the API swaps the `D1`… references back to names after
 * the reply.
 */
export const LlmChatContext = z.object({
  todayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  today: z.object({ captured: Duration, validated: Duration, pending: Duration }).strict(),
  thisWeekValidated: z.object({
    total: Duration,
    days: z.array(z.object({ day: z.enum(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]), validated: Duration }).strict()).length(7),
  }).strict(),
  month: z.object({ securedRevenueEur: z.number().int(), hourlyRateEur: z.number().int() }).strict(),
  journal: z.object({
    pendingCount: z.number().int().nonnegative(),
    pendingTotal: Duration,
    lowConfidenceCount: z.number().int().nonnegative(),
  }).strict(),
  dossiers: z.array(z.object({
    ref: z.string().regex(/^D\d+$/),
    status: DossierStatus,
    billable: z.boolean(),
    validated: Duration,
    pending: Duration,
    budget: Duration.nullable(),
    budgetLeft: Duration.nullable(),
    budgetUsedPct: z.number().int().nonnegative().nullable(),
  }).strict()).max(40),
}).strict();

export type ChatTurn = z.infer<typeof ChatTurn>;
export type ChatRequest = z.infer<typeof ChatRequest>;
export type ChatReply = z.infer<typeof ChatReply>;
export type LlmChatContext = z.infer<typeof LlmChatContext>;
