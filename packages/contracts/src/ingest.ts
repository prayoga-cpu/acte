import { z } from "zod";
import { CapturedSource } from "./enums";

/**
 * Tracker → API upload. This is an ALLOWLIST (strict): any field not listed is rejected.
 * It must never carry document contents, email bodies, filenames, subjects, addresses or URLs.
 * See docs/03-security/PRIVACY_MODEL.md. Changing this schema requires a DECISIONS.md entry.
 */
export const IngestActivity = z.object({
  clientActivityId: z.string().uuid(),
  source: CapturedSource,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMin: z.number().int().positive(),
  dossierId: z.string().uuid().nullable(),      // resolved ON DEVICE (decision D-002)
  confidence: z.number().int().min(0).max(100),
  activityKind: z.enum(["drafting", "review", "correspondence", "research", "other"]),
}).strict();

export const IngestBatch = z.object({
  deviceId: z.string().uuid(),
  companionVersion: z.string(),
  activities: z.array(IngestActivity).max(500),
}).strict();

export type IngestActivity = z.infer<typeof IngestActivity>;
