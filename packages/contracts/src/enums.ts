import { z } from "zod";

export const MemberRole = z.enum([
  "associe", "associee", "collaborateur", "collaboratrice", "juriste_stagiaire",
]);
export const MemberStatus = z.enum(["active", "in_court", "suspended", "invited"]);
export const DossierStatus = z.enum(["progress", "ready", "archived"]);
export const TaskSource = z.enum(["word", "outlook", "web", "manual"]);
export const CapturedSource = TaskSource.exclude(["manual"]);
export const TaskStatus = z.enum(["pending", "validated", "discarded"]);
export const DeviceStatus = z.enum(["online", "offline", "unlinked"]);
export const NotificationType = z.enum(["low_confidence", "budget", "validation_lag", "health"]);

/** Client-defined confidence bands (brief v2 §5.2). */
export const confidenceBand = (score: number) =>
  score >= 90 ? "high" : score >= 80 ? "acceptable" : "review";

export type MemberRole = z.infer<typeof MemberRole>;
export type DossierStatus = z.infer<typeof DossierStatus>;
export type TaskSource = z.infer<typeof TaskSource>;
