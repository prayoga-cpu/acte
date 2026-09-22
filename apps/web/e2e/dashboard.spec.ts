import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Runs against the seeded demo firm (`pnpm --filter @acte/api db:seed`).
 * Serial and single-page on purpose: later steps rely on earlier ones (the
 * signed-in session cookie, a task still pending) rather than reseeding
 * between every assertion, so the whole suite shares one browser page.
 */
test.describe.serial("ACTE dashboard — demo firm", () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("unauthenticated visit to / redirects to /login", async () => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signs in with the seeded demo account", async () => {
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill("vc@charpentier-associes.fr");
    await page.getByLabel("Mot de passe").fill("acte-dev-2026");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Me V. Charpentier")).toBeVisible();
  });

  test("Home renders the seeded KPIs and Journal card", async () => {
    await page.goto("/");
    await expect(page.getByText("6 h 20")).toBeVisible();
    await expect(page.getByText("Rédaction de conclusions")).toBeVisible();
    await expect(page.getByText("6 en attente")).toBeVisible();
  });

  test("validating a task removes it from the pending list", async () => {
    await page.goto("/");
    const row = page.locator(".task-row", { hasText: "Recherche jurisprudence" });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: "Valider" }).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });

  test("Dossiers view renders seeded dossiers and creates a new one", async () => {
    await page.goto("/");
    await page.locator("aside nav button").nth(1).click();
    await expect(page.getByText("Bône c/ SCI Alma")).toBeVisible();

    await page.getByRole("button", { name: "+ Nouveau Dossier" }).click();
    await page.getByLabel("Nom du dossier").fill("Test e2e c/ Playwright");
    await page.getByRole("button", { name: "Créer le dossier" }).click();
    await expect(page.getByText("Test e2e c/ Playwright")).toBeVisible({ timeout: 10_000 });
  });

  test("logs out back to the login page", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: /Me V\. Charpentier/ }).click();
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
