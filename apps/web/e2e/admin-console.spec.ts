import { readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Admin console + invitations (D-014: role-gated, token-bound acceptance).
 * Runs against the seeded demo firm; restores what it changes (the
 * suspended member is reactivated). Lasting additions: invitations/accounts
 * with unique e2e emails, one test dossier, one back-dated task.
 */
const OUTBOX = process.env.EMAIL_DEV_OUTBOX ?? join(tmpdir(), "acte-dev-outbox");

/** The newest dev-outbox link sent to `to` (apps/api/src/email/brevo.service.ts). */
async function lastLinkTo(to: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const mails = readdirSync(OUTBOX)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .map((f) => JSON.parse(readFileSync(join(OUTBOX, f), "utf8")) as { to: string; link: string | null });
    const hit = mails.find((m) => m.to === to && m.link);
    if (hit?.link) return hit.link;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No dev-outbox email to ${to} in ${OUTBOX}`);
}

async function signIn(page: Page, email: string, password = "acte-dev-2026") {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/v1/auth/sign-in/email") && r.request().method() === "POST"),
    page.getByRole("button", { name: "Se connecter" }).click(),
  ]);
  return res;
}

async function openAdminConsole(page: Page) {
  await page.getByRole("button", { name: /Me V\. Charpentier/ }).click();
  await page.getByRole("menuitem", { name: /Console Admin \(Cabinet\)/ }).click();
  await expect(page.getByRole("tab", { name: "Équipe du cabinet" })).toBeVisible();
}

const row = (page: Page, text: string) => page.locator("div.flex-wrap", { hasText: text });

test.describe.serial("Admin console", () => {
  const stamp = Date.now();
  const squatted = `e2e-squat-${stamp}@example.com`;
  const invitee = `e2e-invite-${stamp}@example.com`;
  const cancelled = `e2e-cancel-${stamp}@example.com`;
  let admin: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    admin = await (await browser.newContext()).newPage();
    expect((await signIn(admin, "vc@charpentier-associes.fr")).status()).toBe(200);
    await expect(admin).toHaveURL("/dashboard");
  });

  test.afterAll(async () => {
    await admin.context().close();
  });

  test("a non-admin has no admin entry in the profile menu and is refused by the API", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    expect((await signIn(page, "so@charpentier-associes.fr")).status()).toBe(200);
    await expect(page).toHaveURL("/dashboard");
    await page.getByRole("button", { name: /Me S\. Okafor/ }).click();
    await expect(page.getByRole("button", { name: /Mon Profil/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Console Admin/ })).toHaveCount(0);
    expect((await page.request.get("/v1/firm/members")).status()).toBe(403);
    await page.context().close();
  });

  test("an admin opens the console from the profile menu and sees the team", async () => {
    await openAdminConsole(admin);
    await expect(admin.getByText("Me S. Okafor")).toBeVisible();
    await expect(admin.getByText("C. Lemoine")).toBeVisible();
  });

  test("invites a member, who appears as pending", async () => {
    for (const email of [squatted, invitee, cancelled]) {
      await admin.getByRole("button", { name: "+ Inviter un membre" }).click();
      await admin.getByLabel("Adresse e-mail professionnelle").fill(email);
      await admin.getByRole("button", { name: "Envoyer l'invitation" }).click();
      await expect(row(admin, email).getByText("Invité·e")).toBeVisible({ timeout: 10_000 });
    }
    await expect(row(admin, invitee).getByText("en attente d'activation")).toBeVisible();
  });

  test("re-inviting a pending address is refused with a clear message", async () => {
    await admin.getByRole("button", { name: "+ Inviter un membre" }).click();
    await admin.getByLabel("Adresse e-mail professionnelle").fill(invitee);
    await admin.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(admin.getByText(/Une invitation est déjà en attente pour cette adresse/)).toBeVisible();
    await admin.keyboard.press("Escape");
  });

  test("a plain signup with an invited address does NOT join the inviting firm", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await page.goto("/signup");
    await page.getByLabel("Nom complet").fill("Usurpateur E2E");
    await page.getByLabel("Adresse e-mail").fill(squatted);
    await page.getByLabel("Mot de passe").fill("acte-e2e-squat-2026");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL("/dashboard");
    // They founded their own firm: none of the Charpentier firm's dossiers are visible to them.
    const dossiers = (await (await page.request.get("/v1/dossiers")).json()) as { name: string }[];
    expect(dossiers.some((d) => d.name.includes("Bône"))).toBe(false);
    await page.context().close();

    await admin.reload();
    await openAdminConsole(admin);
    await expect(row(admin, squatted).getByText("Invité·e")).toBeVisible();
    await expect(admin.getByText("Usurpateur E2E")).toHaveCount(0);
  });

  test("the invite link for an address that already has an account explains itself", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await page.goto(await lastLinkTo(squatted));
    await page.getByLabel("Nom complet").fill("Usurpateur E2E");
    await page.getByLabel("Mot de passe").fill("acte-e2e-squat-2026");
    await page.getByRole("button", { name: "Activer mon compte" }).click();
    await expect(page.getByText(/Un compte ACTE existe déjà pour cette adresse/)).toBeVisible();
    await page.context().close();
  });

  test("an unknown invite link shows the invalid-invitation page", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await page.goto("/invite/not-a-real-token");
    await expect(page.getByText("Invitation invalide")).toBeVisible();
    await page.context().close();
  });

  test("the invitee accepts through the emailed link and joins this firm", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await page.goto(await lastLinkTo(invitee));
    await expect(page.getByLabel("Adresse e-mail")).toHaveValue(invitee);
    await page.getByLabel("Nom complet").fill("Recrue E2E");
    await page.getByLabel("Mot de passe").fill("acte-e2e-invite-2026");
    await page.getByRole("button", { name: "Activer mon compte" }).click();
    await expect(page).toHaveURL("/dashboard");
    // Same firm: the seeded dossiers are visible to the new member.
    const dossiers = (await (await page.request.get("/v1/dossiers")).json()) as { name: string }[];
    expect(dossiers.some((d) => d.name.includes("Bône"))).toBe(true);
    // The link is single-use.
    await page.goto(await lastLinkTo(invitee));
    await expect(page.getByText("Invitation invalide")).toBeVisible();
    await page.context().close();

    await admin.reload();
    await openAdminConsole(admin);
    await expect(row(admin, "Recrue E2E").getByText("Actif")).toBeVisible({ timeout: 10_000 });
  });

  test("cancelling an invitation removes the row", async () => {
    await admin.getByRole("button", { name: `Actions pour ${cancelled}` }).click();
    await admin.getByRole("button", { name: "Annuler l'invitation" }).click();
    await expect(admin.getByText("Invitation annulée")).toBeVisible();
    await expect(row(admin, cancelled)).toHaveCount(0);
  });

  test("suspending revokes access, including an open session; reactivating restores it", async ({ browser }) => {
    const context = await browser.newContext();
    const open = await context.newPage();
    expect((await signIn(open, "cl@charpentier-associes.fr")).status()).toBe(200);
    await expect(open).toHaveURL("/dashboard");
    expect((await open.request.get("/v1/me/profile")).status()).toBe(200);

    await admin.getByRole("button", { name: "Actions pour C. Lemoine" }).click();
    await admin.getByRole("button", { name: "Désactiver le compte / Suspendre" }).click();
    await expect(row(admin, "C. Lemoine").getByText("Suspendu")).toBeVisible({ timeout: 10_000 });

    // The already-open session is revoked (the open tab sends itself to /login on its next 401)...
    expect((await open.request.get("/v1/me/profile")).status()).toBe(401);
    await open.close();

    // ...and a fresh sign-in is refused with an explanation.
    const retry = await context.newPage();
    expect((await signIn(retry, "cl@charpentier-associes.fr")).status()).toBe(403);
    await expect(retry.getByText("Ce compte a été suspendu par l'administrateur du cabinet.")).toBeVisible();

    await admin.getByRole("button", { name: "Actions pour C. Lemoine" }).click();
    await admin.getByRole("button", { name: "Réactiver le compte" }).click();
    await expect(row(admin, "C. Lemoine").getByText("Actif")).toBeVisible({ timeout: 10_000 });
    expect((await signIn(retry, "cl@charpentier-associes.fr")).status()).toBe(200);
    await expect(retry).toHaveURL("/dashboard");
    await context.close();
  });

  test("the admin cannot suspend themselves; the refusal is shown, not swallowed", async () => {
    await admin.getByRole("button", { name: "Actions pour Me V. Charpentier" }).click();
    await admin.getByRole("button", { name: "Désactiver le compte / Suspendre" }).click();
    await expect(admin.getByText("Vous ne pouvez pas suspendre votre propre compte.")).toBeVisible();
  });

  test("a budget alert stays read once read, instead of coming back on every refresh", async () => {
    const dossier = (await (
      await admin.request.post("/v1/dossiers", { data: { name: `Alerte e2e ${stamp}`, clientLabel: "e2e", budgetMinutes: 100 } })
    ).json()) as { id: string };
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const task = (await (
      await admin.request.post("/v1/tasks", { data: { dossierId: dossier.id, title: "e2e", startedAt: twoDaysAgo, durationMin: 90 } })
    ).json()) as { id: string };
    await admin.request.post(`/v1/tasks/${task.id}/validate`);

    const bell = admin.getByRole("button", { name: "Notifications" });
    await bell.click();
    const panel = admin.getByRole("menu", { name: "Notifications" });
    await expect(panel.getByText(new RegExp(`Alerte e2e ${stamp}.*90 %`))).toBeVisible();
    await panel.getByRole("button", { name: "Tout marquer comme lu" }).click();
    await admin.keyboard.press("Escape");
    await admin.mouse.click(5, 5);

    // Reopening re-evaluates the rules; the still-true alert must stay read (no badge, no duplicate).
    await bell.click();
    await expect(panel.getByText(new RegExp(`Alerte e2e ${stamp}`))).toHaveCount(1);
    await expect(panel.getByRole("button", { name: "Tout marquer comme lu" })).toHaveCount(0);
  });
});
