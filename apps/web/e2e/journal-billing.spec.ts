import { expect, test, type Browser, type Page } from "@playwright/test";
import { dismissWelcome, lastLinkTo, signUpAndVerify } from "./helpers";

/**
 * The manual-entry loop past the happy path, on a brand-new firm so nothing
 * here touches the demo firm's seeded figures: late-evening entries (BUG-1),
 * earlier days' pending tasks and a scoped "Tout intégrer" (BUG-2), edit /
 * delete / undo (D-018), invoices that bill time once (BUG-5), and the
 * account flows that end in an emailed link (D-017, BUG-3, BUG-4).
 */
test.describe.serial("Journal, billing and account flows", () => {
  let page: Page;
  const stamp = Date.now();
  const email = `e2e-journal-${stamp}@example.com`;
  const password = `Journal-${stamp}-pw`;
  const dossierName = `Dossier journal ${stamp}`;
  let dossierId: string;

  const row = (title: string) => page.locator(".task-row", { hasText: title });
  const tab = (name: string) => page.getByRole("navigation", { name: "Onglets" }).getByRole("button", { name });
  const toast = () => page.locator("#toast");

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await signUpAndVerify(page, { name: "Me Journal E2E", email, password });
    await dismissWelcome(page);
    dossierId = ((await (await page.request.post("/v1/dossiers", { data: { name: dossierName, clientLabel: "e2e", budgetMinutes: 600 } })).json()) as { id: string }).id;
    await page.reload();
    await dismissWelcome(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("a late-evening manual entry stays on today (BUG-1)", async () => {
    await page.getByRole("button", { name: "Saisie manuelle" }).click();
    await page.getByLabel("Intitulé").fill("Conclusions du soir");
    await page.getByLabel("Dossier", { exact: true }).selectOption({ label: dossierName });
    await page.getByLabel("Heure de début").fill("23:30");
    await page.getByLabel("Durée (minutes)").fill("20");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(row("Conclusions du soir")).toHaveCount(1);
    await expect(row("Conclusions du soir")).toContainText("23h30");
  });

  test("a pending entry can be edited from its row menu", async () => {
    // The edit/delete menu lives in the Journal view; Home keeps the prototype's compact row.
    await expect(page.getByRole("button", { name: "Actions pour Conclusions du soir" })).toHaveCount(0);
    await tab("Journal").click();
    await page.getByRole("button", { name: "Actions pour Conclusions du soir" }).click();
    await page.getByRole("menuitem", { name: "Modifier" }).click();
    await page.getByLabel("Intitulé").fill("Conclusions du soir — relues");
    await page.getByLabel("Durée (minutes)").fill("45");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(toast()).toHaveText("Tâche modifiée");
    await expect(row("Conclusions du soir — relues")).toContainText("45 min");
  });

  test("yesterday's pending task shows under today, and « Tout intégrer » validates only what is listed (BUG-2)", async () => {
    const yesterday = new Date(Date.now() - 24 * 3600_000).toISOString();
    await page.request.post("/v1/tasks", { data: { dossierId, title: "Oubli de la veille", startedAt: yesterday, durationMin: 30 } });
    await page.reload();
    await dismissWelcome(page);

    await expect(page.getByText("Jours précédents · 1 en attente")).toBeVisible();
    await expect(row("Oubli de la veille")).toHaveCount(1);
    await expect(page.getByText("2 en attente", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tout intégrer" }).click();
    await expect(toast()).toContainText("2 tâches intégrées");
    await expect(page.getByText("Journée bouclée.")).toBeVisible();
    expect(await (await page.request.get("/v1/tasks/backlog")).json()).toEqual([]);
  });

  test("the Journal moves to another day, and a validation can be undone", async () => {
    await tab("Journal").click();
    await page.getByRole("button", { name: "Jour précédent" }).click();
    await page.getByRole("button", { name: /Validées · 1/ }).click();
    await expect(row("Oubli de la veille")).toHaveCount(1);

    await page.getByRole("button", { name: "Annuler Oubli de la veille" }).click();
    await expect(toast()).toContainText("Validation annulée");
    // Still on the past day: its pending task is also in the carry-over list, and must be counted once.
    await expect(page.getByText(/30 min en attente sur le dossier .+ \(1 tâche\)/)).toBeVisible();
    // Back on today, it is in the carry-over list again.
    await page.getByRole("button", { name: "Jour suivant" }).click();
    await expect(page.getByText("Jours précédents · 1 en attente")).toBeVisible();
  });

  test("a pending task can be deleted", async () => {
    await page.getByRole("button", { name: "Actions pour Oubli de la veille" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.locator("#modal-root").getByRole("button", { name: "Supprimer" }).click();
    await expect(toast()).toHaveText("Tâche supprimée du journal");
    await expect(row("Oubli de la veille")).toHaveCount(0);
  });

  test("an invoice draft bills validated time once (BUG-5)", async () => {
    await tab("Facturation").click();
    await expect(page.getByText("validées à facturer")).toBeVisible();
    await page.getByRole("button", { name: "Générer la facture" }).click();
    await expect(toast()).toHaveText("Facture générée");

    const year = new Date().getFullYear();
    await expect(page.getByText(`FA-${year}-001`)).toBeVisible();
    await expect(page.getByText("Tout le temps validé est facturé", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Générer la facture" })).toHaveCount(0);

    const again = await page.request.post("/v1/billing/invoices", { data: { dossierId } });
    expect(again.status()).toBe(409);
  });

  test("a magic link signs in on the web app and leaves the password intact (BUG-3, BUG-4)", async ({ browser }) => {
    const context = await browser.newContext();
    const visitor = await context.newPage();
    await visitor.goto("/login");
    await visitor.getByRole("button", { name: "Recevoir un lien magique" }).click();
    await visitor.getByLabel("Adresse e-mail").fill(email);
    await visitor.getByRole("button", { name: "Recevoir un lien magique" }).first().click();
    await expect(visitor.getByText(/Lien envoyé/)).toBeVisible();

    await visitor.goto(await lastLinkTo(email, "lien de connexion"));
    await expect(visitor).toHaveURL("/dashboard");
    await expect(visitor.getByText("Me Journal E2E")).toBeVisible();
    await context.close();

    const check = await browser.newContext();
    const res = await check.request.post("/v1/auth/sign-in/email", { data: { email, password } });
    expect(res.status()).toBe(200);
    await check.close();
  });

  test("a forgotten password is reset through the emailed link", async ({ browser }) => {
    const context = await browser.newContext();
    const visitor = await context.newPage();
    await visitor.goto("/login");
    await visitor.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(visitor).toHaveURL(/\/forgot-password$/);
    // The form is a client component: wait until it has hydrated, or the typed address is wiped when it does.
    await visitor.waitForLoadState("networkidle");
    await expect(async () => {
      await visitor.getByLabel("Adresse e-mail").fill(email);
      await visitor.getByRole("button", { name: "Envoyer le lien" }).click();
      await expect(visitor.getByText(/un lien vient d'y être envoyé/)).toBeVisible({ timeout: 5_000 });
    }).toPass();

    await visitor.goto(await lastLinkTo(email, "Réinitialisation"));
    await expect(visitor).toHaveURL(/\/reset-password\?token=/);
    await visitor.waitForLoadState("networkidle");
    await expect(async () => {
      await visitor.getByLabel("Nouveau mot de passe").fill("acte-e2e-reset-2026");
      await visitor.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
      await expect(visitor.getByText("Mot de passe modifié. Vous pouvez vous connecter.")).toBeVisible({ timeout: 5_000 });
    }).toPass();

    await visitor.goto("/login");
    await visitor.getByLabel("Adresse e-mail").fill(email);
    await visitor.getByLabel("Mot de passe").fill("acte-e2e-reset-2026");
    await visitor.getByRole("button", { name: "Se connecter" }).click();
    await expect(visitor).toHaveURL("/dashboard");
    await context.close();
  });
});
