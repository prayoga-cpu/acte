import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Set only while POST /v1/invitations/:token/accept is creating the
 * invitee's account. The signup hook in auth.config.ts reads it to skip
 * "create a new firm" — the accept endpoint binds the new user to the
 * invitation's firm itself, by token, never by email.
 */
export const invitationAcceptance = new AsyncLocalStorage<{ invitationId: string }>();

/**
 * Set while an account is being created by something that proves or presets
 * the address itself — accepting an emailed invitation, or the seed script —
 * so the signup hook does not also send a "confirm your address" email.
 */
export const silentSignup = new AsyncLocalStorage<true>();
