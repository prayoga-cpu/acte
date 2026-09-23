import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Covers the funnel's actual entry point (land -> create account -> add
 * first dossier -> manual entry -> validate), which the seeded-demo-firm
 * suite (dashboard.spec.ts) never exercises: that suite starts from an
 * already-populated firm, so it never proves a brand-new firm's empty
 * states render instead of crashing, or that signup itself works end to
 * end. Serial and single-page for the same reason as dashboard.spec.ts:
 * later steps depend on the signed-in session and the dossier/task
 * created earlier in the flow.
 */
test.describe.serial("New firm signup funnel", () => {
  let page: Page;
  const email = `e2e-${Date.now()}@example.com`;
  const dossierName = `Test e2e signup ${Date.now()}`;
  const taskTitle = "Recherche jurisprudence e2e";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("creates an account from the landing page CTA", async () => {
    await page.goto("/");
    await page.getByRole("link", { name: "Créer un compte" }).first().click();
    await expect(page).toHaveURL(/\/signup$/);

    await page.getByLabel("Nom complet").fill("Test E2E Avocat");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill("acte-e2e-signup-2026");
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Test E2E Avocat")).toBeVisible();
  });

  test("a brand-new firm's Home renders an empty Journal instead of crashing", async () => {
    await expect(page.getByText("À jour ✓")).toBeVisible();
  });

  test("creates the first dossier", async () => {
    await page.locator("aside nav button").nth(1).click();
    await page.getByRole("button", { name: "+ Nouveau Dossier" }).click();
    await page.getByLabel("Nom du dossier").fill(dossierName);
    await page.getByRole("button", { name: "Créer le dossier" }).click();
    await expect(page.getByRole("heading", { name: dossierName })).toBeVisible({ timeout: 10_000 });
  });

  test("adds a manual time entry against that dossier and validates it", async () => {
    await page.getByRole("button", { name: "Accueil" }).click();
    await page.getByRole("button", { name: "Saisie manuelle" }).click();
    await page.getByLabel("Intitulé").fill(taskTitle);
    await page.getByLabel("Dossier", { exact: true }).selectOption({ label: dossierName });
    await page.getByRole("button", { name: "Ajouter" }).click();

    const row = page.locator(".task-row", { hasText: taskTitle });
    await expect(row).toHaveCount(1, { timeout: 10_000 });
    await row.getByRole("button", { name: "Valider" }).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });
});
