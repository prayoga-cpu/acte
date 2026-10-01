import { readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";

/** The API's dev outbox (apps/api/src/email/brevo.service.ts): one JSON file per email, no Brevo account needed. */
export const OUTBOX = process.env.EMAIL_DEV_OUTBOX ?? join(tmpdir(), "acte-dev-outbox");

/** The newest emailed link to `to` — optionally only among emails whose subject contains `subjectIncludes`. */
export async function lastLinkTo(to: string, subjectIncludes?: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const mails = readdirSync(OUTBOX)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .map((f) => JSON.parse(readFileSync(join(OUTBOX, f), "utf8")) as { to: string; subject: string; link: string | null });
    const hit = mails.find((m) => m.to === to && m.link && (!subjectIncludes || m.subject.includes(subjectIncludes)));
    if (hit?.link) return hit.link;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No dev-outbox email to ${to}${subjectIncludes ? ` about "${subjectIncludes}"` : ""} in ${OUTBOX}`);
}

/**
 * Signs up through /signup and follows the emailed verification link (D-017:
 * an account is unusable until its address is confirmed). Ends on /dashboard,
 * signed in as the founder of a brand-new firm.
 */
export async function signUpAndVerify(page: Page, input: { name: string; email: string; password: string }) {
  await page.goto("/signup");
  await page.getByLabel("Nom complet").fill(input.name);
  await page.getByLabel("Adresse e-mail").fill(input.email);
  await page.getByLabel("Mot de passe").fill(input.password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("Confirmez votre adresse e-mail")).toBeVisible();
  await page.goto(await lastLinkTo(input.email, "Confirmez"));
  await expect(page).toHaveURL("/dashboard");
}

/** The first-run welcome (D-021) covers the dashboard for a new member: put it off, if it is there. */
export async function dismissWelcome(page: Page) {
  const later = page.getByRole("button", { name: "Plus tard" });
  if (await later.isVisible().catch(() => false)) await later.click();
}
