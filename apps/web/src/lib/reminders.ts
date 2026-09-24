/** "rappel envoyé ✓" only while the reminder is recent — not forever after the first one. */
const REMINDER_FRESH_MS = 7 * 24 * 60 * 60 * 1000;

export const isRecentReminder = (remindedAt: string | null) =>
  !!remindedAt && Date.now() - new Date(remindedAt).getTime() < REMINDER_FRESH_MS;
