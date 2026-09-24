import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

function isDeployed(): boolean {
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
}

/**
 * The dev outbox is opt-in, never a default: a server started without
 * NODE_ENV (e.g. `pnpm start` on a future Scaleway host) must not quietly
 * write sign-in links to disk. Enabled by the `dev` script
 * (NODE_ENV=development) or an explicit EMAIL_DEV_OUTBOX (CI, e2e).
 */
function devOutboxEnabled(): boolean {
  if (isDeployed()) return false;
  return Boolean(process.env.EMAIL_DEV_OUTBOX) || process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

/** Local dev/CI mailbox — one JSON file per email, read by the e2e suite. */
export function devOutboxDir(): string {
  return process.env.EMAIL_DEV_OUTBOX ?? join(tmpdir(), "acte-dev-outbox");
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Thin wrapper around Brevo's transactional email API (CLAUDE.md stack).
 *
 * Without BREVO_API_KEY this fails closed — magic links and invite links
 * are bearer credentials, and silently "sending" nothing (or worse, logging
 * the link) is not acceptable — unless the dev outbox is explicitly enabled
 * (local dev, CI): then the email lands in a JSON file instead; the link
 * never goes to the console, so it can't end up in a shipped log.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL ?? "no-reply@acte.app";

  if (!apiKey) {
    if (!devOutboxEnabled()) {
      throw new Error("BREVO_API_KEY is not configured — refusing to drop a transactional email");
    }
    const link = input.html.match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&") ?? null;
    const dir = devOutboxDir();
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
    writeFileSync(file, JSON.stringify({ to: input.to, subject: input.subject, link, sentAt: new Date().toISOString() }));
    console.log(`[email:dev] subject="${input.subject}" → ${file}`);
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { email: fromEmail, name: "ACTE" },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo send failed: ${res.status} ${await res.text()}`);
  }
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const u = escapeHtml(url);
  await sendEmail({
    to: email,
    subject: "Votre lien de connexion ACTE",
    html: `<p>Cliquez pour vous connecter à ACTE : <a href="${u}">${u}</a></p><p>Ce lien expire dans 5 minutes.</p>`,
  });
}

const ROLE_LABEL_FR: Record<string, string> = {
  associe: "Associé",
  associee: "Associée",
  collaborateur: "Collaborateur",
  collaboratrice: "Collaboratrice",
  juriste_stagiaire: "Juriste stagiaire",
};

export async function sendInvitationEmail(email: string, url: string, firmName: string, role: string): Promise<void> {
  const roleLabel = ROLE_LABEL_FR[role] ?? role;
  const u = escapeHtml(url);
  await sendEmail({
    to: email,
    subject: `Invitation à rejoindre ${firmName} sur ACTE`,
    html: `<p>Vous êtes invité·e à rejoindre <b>${escapeHtml(firmName)}</b> sur ACTE en tant que <b>${escapeHtml(roleLabel)}</b>.</p><p><a href="${u}">${u}</a></p><p>Ce lien expire dans 7 jours.</p>`,
  });
}

export async function sendInvitationReminderEmail(email: string, url: string, firmName: string): Promise<void> {
  const u = escapeHtml(url);
  await sendEmail({
    to: email,
    subject: `Rappel — invitation en attente pour ${firmName} sur ACTE`,
    html: `<p>Votre invitation à rejoindre <b>${escapeHtml(firmName)}</b> sur ACTE est toujours en attente.</p><p><a href="${u}">${u}</a></p><p>Ce lien expire dans 7 jours.</p>`,
  });
}

/** "Rappeler la validation" — nudges a member with pending Journal tasks, no task detail included. */
export async function sendValidationReminderEmail(email: string, displayName: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Rappel — temps en attente de validation sur ACTE",
    html: `<p>Bonjour ${escapeHtml(displayName)},</p><p>Des temps capturés sont en attente de validation dans votre Journal ACTE.</p>`,
  });
}
