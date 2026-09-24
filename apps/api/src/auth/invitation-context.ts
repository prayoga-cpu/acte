import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Set only while POST /v1/invitations/:token/accept is creating the
 * invitee's account. The signup hook in auth.config.ts reads it to skip
 * "create a new firm" — the accept endpoint binds the new user to the
 * invitation's firm itself, by token, never by email.
 */
export const invitationAcceptance = new AsyncLocalStorage<{ invitationId: string }>();
