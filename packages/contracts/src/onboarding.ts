import { z } from "zod";

/**
 * GET /v1/me/onboarding · POST /v1/me/onboarding/complete — the first-run
 * welcome and the "Premiers pas" checklist of the help centre (D-021).
 *
 * Booleans and one timestamp only, `.strict()` at both levels: every item is
 * derived server-side from the member's own rows, so nothing here can carry
 * a dossier name, a client label or a task title.
 */
export const OnboardingState = z.object({
  /** Null until the member has seen the welcome. Stamped once, never cleared. */
  completedAt: z.string().datetime().nullable(),
  checklist: z.object({
    /** The member's own hourly rate is above 0 (a firm founder starts at 0 €). */
    hourlyRateSet: z.boolean(),
    /** The firm has at least one dossier. */
    hasDossier: z.boolean(),
    /** The member has at least one task of their own, any day, any status. */
    hasTask: z.boolean(),
    hasValidatedTask: z.boolean(),
    /** Admins only (always false otherwise): another member or a pending invitation exists. */
    hasInvitedMember: z.boolean(),
  }).strict(),
}).strict();

export type OnboardingState = z.infer<typeof OnboardingState>;
