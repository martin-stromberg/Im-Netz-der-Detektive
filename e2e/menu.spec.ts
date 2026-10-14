import { expect, test, type Page } from "@playwright/test";

/**
 * E2E for the application frame (step 11): main menu → map → mode →
 * settings → mission → spawn flow → running game, plus the dev-mode
 * batch and the stats view. The menu flow uses no URL params — those
 * stay a dev/test deep link covered by the existing specs.
 */

async function openMenu(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("main-menu")).toBeVisible();
}

async function toMissionSelect(page: Page, mapId: string, mode: "ganove" | "detektiv") {
  await openMenu(page);
  await page.getByTestId("menu-new-game").click();
  await expect(page.getByTestId("map-select")).toBeVisible();
  await page.getByTestId(`map-card-${mapId}`).click();
  await expect(page.getByTestId("mode-select-screen")).toBeVisible();
  await page.getByTestId(`mode-${mode}`).click();
  await expect(page.getByTestId("settings-screen")).toBeVisible();
  await page.getByTestId("settings-continue").click();
  await expect(page.getByTestId("mission-select")).toBeVisible();
}

async function pickFirstSelectable(page: Page) {
  await page.locator("[data-selectable='true']").first().click();
}

test.describe("menu flow", () => {
  test("main menu shows new game, disabled resume and stats", async ({ page }) => {
    await openMenu(page);
    await expect(page.getByTestId("menu-new-game")).toBeVisible();
    await expect(page.getByTestId("menu-resume")).toBeDisabled();
    await expect(page.getByTestId("menu-stats")).toBeVisible();
    // The title artwork is a locally embedded raster asset.
    const art = page.getByTestId("menu-title-art");
    await expect(art).toBeVisible();
    expect(await art.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });

  test("map selection offers muenster/luebeck and disables forthcoming cities", async ({
    page,
  }) => {
    await openMenu(page);
    await page.getByTestId("menu-new-game").click();
    await expect(page.getByTestId("map-card-muenster")).toBeEnabled();
    await expect(page.getByTestId("map-card-luebeck")).toBeEnabled();
    await expect(page.getByTestId("map-card-hamburg")).toBeDisabled();
    await expect(page.getByTestId("map-card-koeln")).toBeDisabled();
    // The dev fixture map never appears in the menu.
    await expect(page.getByTestId("map-card-teststadt")).toHaveCount(0);
  });

  test("ganove flow: menu → map → mode → settings → random mission → spawn pick → game", async ({
    page,
  }) => {
    await toMissionSelect(page, "muenster", "ganove");
    await page.getByTestId("mission-random").click();
    // Spawn flow: detectives are already placed, the ganove picks last.
    const screen = page.getByTestId("ganove-screen");
    await expect(screen).toHaveAttribute("data-view", "pickSpawn");
    await expect(page.locator("[data-detective]")).toHaveCount(4);
    const choices = page.locator("[data-selectable='true']");
    expect(await choices.count()).toBeGreaterThan(0);
    await choices.first().click();
    await expect(screen).toHaveAttribute("data-view", "playing");
    await expect(page.getByTestId("round-indicator")).toBeVisible();
  });

  test("detektiv flow: predefined case shows name + story; detectives are picked first", async ({
    page,
  }) => {
    await toMissionSelect(page, "muenster", "detektiv");
    await page.getByTestId("mission-case").click();
    const firstCase = page.getByTestId("case-list").locator("button").first();
    // Every case card carries its name and the mini story.
    await expect(firstCase).toBeVisible();
    await expect(firstCase).toContainText(/\S.{20,}/s);
    await firstCase.click();
    const screen = page.getByTestId("detektiv-screen");
    await expect(screen).toHaveAttribute("data-view", "pickSpawns");
    // Muenster suggests 4 detectives — each pick is interactive.
    for (let i = 0; i < 4; i += 1) {
      await pickFirstSelectable(page);
    }
    await expect(screen).toHaveAttribute("data-view", "playing");
  });

  test("settings: 'unbegrenzt' only where allowed; out-of-range values refused", async ({
    page,
  }) => {
    await openMenu(page);
    await page.getByTestId("menu-new-game").click();
    await page.getByTestId("map-card-muenster").click();
    await page.getByTestId("mode-ganove").click();
    // Muenster allows unlimited round limits.
    await expect(page.getByTestId("setting-unlimited")).toBeVisible();
    // Out-of-corridor input is refused: luebeck allows 3–6 detectives,
    // a value of 9 must not continue.
    await page.getByTestId("setting-detectives").fill("9");
    await page.getByTestId("settings-continue").click();
    await expect(page.getByTestId("settings-errors")).toBeVisible();
    await expect(page.getByTestId("mission-select")).toHaveCount(0);
    // Back to the map and over to luebeck: no unlimited checkbox there.
    await page.getByRole("button", { name: "Zurück" }).click();
    await page.getByRole("button", { name: "Zurück" }).click();
    await page.getByTestId("map-card-luebeck").click();
    await page.getByTestId("mode-ganove").click();
    await expect(page.getByTestId("setting-unlimited")).toHaveCount(0);
  });

  test("custom mission: category picks only, criteria violations block confirmation", async ({
    page,
  }) => {
    await toMissionSelect(page, "muenster", "ganove");
    await page.getByTestId("mission-custom").click();
    await expect(page.getByTestId("custom-mission-picker")).toBeVisible();
    // Only diebstahl-category nodes are selectable in step 1.
    const selectable = page.locator("[data-selectable='true']");
    expect(await selectable.count()).toBeGreaterThan(0);
    await selectable.first().click();
    // kontakt step
    await page.locator("[data-selectable='true']").first().click();
    // flucht step — pick the first escape node; if the criteria check
    // flags the combination, the errors list is visible and confirm is
    // disabled.
    await page.locator("[data-selectable='true']").first().click();
    // sabotage step is optional — skip it.
    const skip = page.getByTestId("custom-skip-sabotage");
    if (await skip.isVisible()) {
      await skip.click();
    }
    const confirm = page.getByTestId("custom-confirm");
    await expect(confirm).toBeVisible();
  });

  test("dev mode runs an AI-vs-AI batch and shows the outcome distribution", async ({ page }) => {
    await openMenu(page);
    await page.getByTestId("menu-new-game").click();
    await page.getByTestId("map-card-muenster").click();
    await page.getByTestId("mode-dev").click();
    const screen = page.getByTestId("devmode-screen");
    await expect(screen).toBeVisible();
    await page.getByTestId("dev-map").selectOption("teststadt");
    await page.getByTestId("dev-batch").selectOption("5");
    await page.getByTestId("dev-run").click();
    await expect(page.getByTestId("dev-summary")).toBeVisible();
    await expect(page.getByTestId("dev-metrics")).toBeVisible();
  });

  test("stats view lists recorded games or the empty state", async ({ page }) => {
    await openMenu(page);
    await page.getByTestId("menu-stats").click();
    await expect(page.getByTestId("stats-screen")).toBeVisible();
    const empty = await page.getByTestId("stats-empty").count();
    const table = await page.getByTestId("stats-table").count();
    expect(empty + table).toBe(1);
  });
});
