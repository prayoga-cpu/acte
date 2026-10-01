import { expect, test, type Browser, type Page } from "@playwright/test";
import { signUpAndVerify } from "./helpers";

/**
 * First-run welcome, guided tour and help centre (D-021). Creates its own
 * firm: the welcome is only for a member who has never seen it, which no
 * seeded demo account is. Serial and single-page, like the other suites —
 * each step builds on the previous one's state.
 */
test.describe.serial("Welcome, guided tour and help centre", () => {
  let page: Page;
  const email = `e2e-onboarding-${Date.now()}@example.com`;

  const welcome = () => page.getByRole("heading", { name: "Bienvenue dans ACTE." });
  const helpCentre = () => page.getByRole("heading", { name: "Guides & premiers pas" });
  const tourCard = () => page.getByRole("dialog");
  const firstSteps = () => page.getByTestId("first-steps");
  const guides = () => page.getByRole("list").filter({ has: page.getByRole("button", { name: /Tour d'horizon/ }) });

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("a new member is greeted once, and the API knows they have not been yet", async () => {
    await signUpAndVerify(page, { name: "Nouvelle Avocate E2E", email, password: "acte-e2e-onboarding-2026" });

    await expect(welcome()).toBeVisible();
    const state = (await (await page.request.get("/v1/me/onboarding")).json()) as { completedAt: string | null; checklist: Record<string, boolean> };
    expect(state.completedAt).toBeNull();
    // A founder starts at their role's default rate, so the rate is already set; nothing else is done yet.
    expect(state.checklist).toEqual({ hourlyRateSet: true, hasDossier: false, hasTask: false, hasValidatedTask: false, hasInvitedMember: false });
  });

  test("the welcome starts the overview tour, which walks to the help button", async () => {
    await page.getByRole("button", { name: "Démarrer la visite guidée" }).click();
    await expect(welcome()).toHaveCount(0);

    await expect(tourCard().getByRole("heading", { name: "Trois onglets pour l'essentiel" })).toBeVisible();
    await expect(tourCard().getByText("1 / 8")).toBeVisible();

    // The page under a running tour is shielded: clicking where the Facturation tab is does not open it.
    const billingTab = page.getByRole("button", { name: "Facturation", exact: true });
    const box = (await billingTab.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(billingTab).not.toHaveClass(/is-active/);
    await expect(tourCard()).toBeVisible();

    await tourCard().getByRole("button", { name: "Suivant" }).click();
    await expect(tourCard().getByRole("heading", { name: "Les autres vues" })).toBeVisible();
    await tourCard().getByRole("button", { name: "Précédent" }).click();
    await expect(tourCard().getByText("1 / 8")).toBeVisible();

    for (let step = 1; step < 8; step++) await page.keyboard.press("ArrowRight");
    await expect(tourCard().getByText("8 / 8")).toBeVisible();
    await expect(tourCard().getByRole("heading", { name: "Aide & guides" })).toBeVisible();
    await tourCard().getByRole("button", { name: "Terminer" }).click();
    await expect(tourCard()).toHaveCount(0);
  });

  test("the tour ends in the help centre, where the first steps reflect what the member has done", async () => {
    await expect(helpCentre()).toBeVisible();
    // Three steps to take; "set your hourly rate" is not one of them, since the rate is not 0 €.
    await expect(firstSteps().getByText("0 / 3")).toBeVisible();
    await expect(firstSteps().getByText("Définir votre taux horaire")).toHaveCount(0);
    // A founder is the firm's admin: the admin guide is offered.
    await expect(guides().getByRole("button", { name: /Console Admin.*5 étapes/ })).toBeVisible();

    // "Y aller" leads to the view where the step is done.
    await firstSteps().getByRole("button", { name: "Y aller — Créer un premier dossier" }).click();
    await expect(helpCentre()).toHaveCount(0);
    await page.getByRole("button", { name: "+ Nouveau Dossier" }).click();
    await page.getByLabel("Nom du dossier").fill(`Premiers pas e2e ${Date.now()}`);
    await page.getByRole("button", { name: "Créer le dossier" }).click();
    await expect(page.getByRole("heading", { name: /Premiers pas e2e/ })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Aide & guides" }).click();
    await expect(firstSteps().getByText("1 / 3")).toBeVisible();
    await expect(firstSteps().locator('li[data-done="true"]')).toHaveText(/Créer un premier dossier/);
  });

  test("the current view's guide comes first and spotlights real elements of that view", async () => {
    await expect(guides().getByRole("button").first()).toHaveText(/Dossiers.*Vue actuelle/);

    await guides().getByRole("button", { name: /Journal.*9 étapes/ }).click();
    await expect(tourCard().getByRole("heading", { name: "Le temps à valider" })).toBeVisible();
    // The guide took the member to the Journal view.
    await expect(page.locator('[data-tour="journal-list"]')).toBeVisible();

    // Leaving early with Escape closes the tour without reopening the help centre.
    await page.keyboard.press("Escape");
    await expect(tourCard()).toHaveCount(0);
    await expect(helpCentre()).toHaveCount(0);
  });

  test("an admin whose hourly rate is 0 € is asked to set it, and taken to the console", async () => {
    const me = (await (await page.request.get("/v1/me/profile")).json()) as { id: string };
    expect((await page.request.patch(`/v1/firm/members/${me.id}`, { data: { hourlyRateCents: 0 } })).ok()).toBe(true);

    await page.getByRole("button", { name: "Aide & guides" }).click();
    await expect(firstSteps().getByText("1 / 4")).toBeVisible();
    await firstSteps().getByRole("button", { name: "Y aller — Définir votre taux horaire" }).click();
    await expect(page.getByRole("tab", { name: "Équipe du cabinet" })).toBeVisible();
  });

  test("the welcome does not come back on the next visit, but can be replayed from the help centre", async () => {
    await page.reload();
    await expect(page.getByText("Nouvelle Avocate E2E", { exact: true })).toBeVisible();
    await expect(welcome()).toHaveCount(0);

    await page.getByRole("button", { name: "Aide & guides" }).click();
    await page.getByRole("button", { name: "Revoir le message de bienvenue" }).click();
    await expect(welcome()).toBeVisible();
    await page.getByRole("button", { name: "Plus tard" }).click();
    await expect(welcome()).toHaveCount(0);
  });

  test("a member of an established firm is not greeted, and a non-admin is not offered the admin guide", async ({ browser }) => {
    const other = await (await browser.newContext()).newPage();
    await other.goto("/login");
    await other.getByLabel("Adresse e-mail").fill("so@charpentier-associes.fr");
    await other.getByLabel("Mot de passe").fill("acte-dev-2026");
    await other.getByRole("button", { name: "Se connecter" }).click();
    await expect(other).toHaveURL("/dashboard");
    await expect(other.getByText("Me S. Okafor")).toBeVisible();
    await expect(other.getByRole("heading", { name: "Bienvenue dans ACTE." })).toHaveCount(0);

    await other.getByRole("button", { name: "Aide & guides" }).click();
    await expect(other.getByRole("heading", { name: "Guides & premiers pas" })).toBeVisible();
    await expect(other.getByRole("button", { name: /Tour d'horizon/ })).toBeVisible();
    await expect(other.getByRole("button", { name: /Console Admin/ })).toHaveCount(0);
    await other.context().close();
  });
});
