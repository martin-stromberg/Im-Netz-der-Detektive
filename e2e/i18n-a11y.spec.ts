import { expect, test, type Page } from "@playwright/test";

/**
 * E2E for step 13 (i18n final + accessibility + audio settings):
 *
 * - the runtime language switch DE→EN→DE over the settings menu and
 *   its effect on every following screen plus persistence across reload,
 * - the full core flow by keyboard only: menu → map → mode → mission →
 *   spawn pick → move → abort, including arrow-key roaming on the map,
 * - audio preferences (volume slider, mute) stored under `indd.ui-prefs`.
 *
 * `window.__gameStore` is only read for the position assertion — every
 * interaction is a real key press or click.
 */

/** Tabs forward until the element owns the focus (menu flow). */
async function tabTo(page: Page, testId: string, maxTabs = 40) {
  for (let i = 0; i < maxTabs; i += 1) {
    const focused = await page.getByTestId(testId).evaluate((el) => el === document.activeElement);
    if (focused) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error(`never reached ${testId} by Tab`);
}

test("language switch applies immediately, everywhere, and persists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("main-menu")).toBeVisible();

  await page.getByTestId("menu-settings").click();
  await expect(page.getByTestId("app-settings-screen")).toBeVisible();
  await page.getByTestId("language-en").click();

  // <html lang> follows the preference for assistive technology.
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // The settings screen itself re-renders in English at once.
  await expect(page.getByTestId("app-settings-screen")).toContainText("Language");

  await page.getByTestId("app-settings-back").click();
  await expect(page.getByTestId("menu-new-game")).toHaveText("New game");

  // Persists across reloads.
  await page.reload();
  await expect(page.getByTestId("menu-new-game")).toHaveText("New game");

  // And reaches every downstream screen: map card tagline + mission case.
  await page.getByTestId("menu-new-game").click();
  await expect(page.getByTestId("map-card-muenster")).toContainText("city of bicycles");
  await page.getByTestId("map-card-muenster").click();
  await page.getByTestId("mode-ganove").click();
  await page.getByTestId("settings-continue").click();
  await page.getByTestId("mission-case").click();
  await expect(page.getByTestId("case-diebstahlserie-altstadt")).toContainText("break-in spree");

  // Back to German — the switch is reversible mid-flow.
  await page.reload();
  await page.getByTestId("menu-settings").click();
  await page.getByTestId("language-de").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.getByTestId("app-settings-back").click();
  await expect(page.getByTestId("menu-new-game")).toHaveText("Neue Partie");
});

test("volume slider and mute switch persist in indd.ui-prefs", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("menu-settings").click();
  await page.getByTestId("audio-volume").fill("40");
  await page.getByTestId("audio-muted").check();
  const prefs = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("indd.ui-prefs") ?? "{}"),
  );
  expect(prefs.audioVolume).toBe(40);
  expect(prefs.audioMuted).toBe(true);
  await page.reload();
  await page.getByTestId("menu-settings").click();
  await expect(page.getByTestId("audio-volume")).toHaveValue("40");
  await expect(page.getByTestId("audio-muted")).toBeChecked();
});

test("core ganove flow is completable by keyboard only", async ({ page }) => {
  await page.goto("/");

  // Main menu → map → mode → settings → mission, everything by Tab+Enter.
  await tabTo(page, "menu-new-game");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("map-select")).toBeVisible();

  await tabTo(page, "map-card-muenster");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("mode-select-screen")).toBeVisible();

  await tabTo(page, "mode-ganove");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("settings-screen")).toBeVisible();

  await tabTo(page, "settings-continue");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("mission-select")).toBeVisible();

  await tabTo(page, "mission-none");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");

  // Spawn pick via the map: focus a selectable node, roam with the
  // arrow keys (focus must move to a different node), confirm with Enter.
  const firstSpawn = page.locator('[data-selectable="true"]').first();
  const firstId = await firstSpawn.getAttribute("data-node-id");
  await firstSpawn.focus();
  for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
    await page.keyboard.press(key);
    const moved = await page.evaluate(
      () => document.activeElement?.getAttribute("data-node-id") ?? null,
    );
    if (moved !== null && moved !== firstId) {
      break;
    }
  }
  const roamed = await page.evaluate(
    () => document.activeElement?.getAttribute("data-node-id") ?? null,
  );
  expect(roamed).not.toBeNull();
  expect(roamed).not.toBe(firstId);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "playing");

  // A legal move by keyboard: Enter on a legal target moves the ganove.
  const position = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __gameStore: { getState: () => { ganovePosition: string | null } };
          }
        ).__gameStore.getState().ganovePosition,
    );
  const before = await position();
  const target = page.locator('[data-legal-target="true"]').first();
  await target.focus();
  await page.keyboard.press("Enter");
  await expect.poll(position).not.toBe(before);

  // Abort via keyboard → draw outcome.
  await tabTo(page, "abort-button");
  await page.keyboard.press("Enter");
  await page.getByTestId("abort-yes").press("Enter");
  await expect(page.getByTestId("outcome-panel")).toHaveAttribute("data-outcome", "draw");
});
