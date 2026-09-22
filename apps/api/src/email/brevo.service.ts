const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Thin wrapper around Brevo's transactional email API (CLAUDE.md stack).
 * Falls back to a console log when BREVO_API_KEY is unset, so local dev
 * and CI never need a real Brevo account.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL ?? "no-reply@acte.app";

  if (!apiKey) {
    console.log(`[email:dev] to=${input.to} subject="${input.subject}"`);
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
  await sendEmail({
    to: email,
    subject: "Votre lien de connexion ACTE",
    html: `<p>Cliquez pour vous connecter à ACTE : <a href="${url}">${url}</a></p><p>Ce lien expire dans 5 minutes.</p>`,
  });
}
