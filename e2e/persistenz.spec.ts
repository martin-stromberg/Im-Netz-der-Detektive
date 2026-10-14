import { expect, test, type Page } from "@playwright/test";

/**
 * E2E for step 12 — persistence & replay: saving a running game and
 * resuming it identically through the menu, the statistics aggregates
 * over recorded games, the log management (view/replay, export,
 * delete) and the replay player's timeline + perspective filter.
 */

interface StoreSnap {
  round: number;
  phase: string;
  activeDetectiveIndex: number;
  ganovePosition: string | null;
  detektivePositions: string[];
  radioUsed: boolean;
  outcome: string | null;
}

async function storeSnapshot(page: Page): Promise<StoreSnap> {
  return page.evaluate(() => {
    const s = (
      window as unknown as {
        __gameStore: {
          getState: () => {
            round: number;
            phase: string;
            activeDetectiveIndex: number;
            ganovePosition: string | null;
            detektivePositions: string[];
            radioUsed: boolean;
            outcome: string | null;
          };
        };
      }
    ).__gameStore.getState();
    return {
      round: s.round,
      phase: s.phase,
      activeDetectiveIndex: s.activeDetectiveIndex,
      ganovePosition: s.ganovePosition,
      detektivePositions: s.detektivePositions,
      radioUsed: s.radioUsed,
      outcome: s.outcome,
    };
  });
}

async function openMenu(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("main-menu")).toBeVisible();
}

/** Number of JSONL logs retained under the `game-logs` FIFO key. */
async function storedLogCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("im-netz-der-detektive:game-logs");
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  });
}

/** Menu flow into a running ganove game on muenster (random mission). */
async function startGanoveGame(page: Page) {
  await openMenu(page);
  await page.getByTestId("menu-new-game").click();
  await page.getByTestId("map-card-muenster").click();
  await page.getByTestId("mode-ganove").click();
  await page.getByTestId("settings-continue").click();
  await page.getByTestId("mission-random").click();
  const screen = page.getByTestId("ganove-screen");
  await expect(screen).toHaveAttribute("data-view", "pickSpawn");
  await page.locator("[data-selectable='true']").first().click();
  await expect(screen).toHaveAttribute("data-view", "playing");
}

/** Produces recorded logs by running a small AI batch in dev mode. */
async function recordBatch(page: Page) {
  await openMenu(page);
  await page.getByTestId("menu-new-game").click();
  await page.getByTestId("map-card-muenster").click();
  await page.getByTestId("mode-dev").click();
  await page.getByTestId("dev-map").selectOption("teststadt");
  await page.getByTestId("dev-batch").selectOption("5");
  await page.getByTestId("dev-run").click();
  await expect(page.getByTestId("dev-summary")).toBeVisible();
  await openMenu(page);
  await page.getByTestId("menu-stats").click();
  await expect(page.getByTestId("stats-screen")).toBeVisible();
}

test.describe("save & resume", () => {
  test("saved ganove game resumes to the identical state after a reload", async ({ page }) => {
    await startGanoveGame(page);
    const before = await storeSnapshot(page);
    expect(before.phase).toBe("ganove");
    await page.getByTestId("save-button").click();

    // Full reload — the state must survive in localStorage.
    await page.reload();
    await expect(page.getByTestId("menu-resume")).toBeEnabled();
    await page.getByTestId("menu-resume").click();
    await expect(page.getByTestId("resume-screen")).toBeVisible();
    await expect(page.locator("[data-resume-entry]")).toHaveCount(1);
    await page.locator("[data-resume-entry] button").first().click();

    const screen = page.getByTestId("ganove-screen");
    await expect(screen).toHaveAttribute("data-view", "playing");
    const after = await storeSnapshot(page);
    expect(after).toEqual(before);
  });

  test("saved detektiv game resumes into the detective screen", async ({ page }) => {
    await openMenu(page);
    await page.getByTestId("menu-new-game").click();
    await page.getByTestId("map-card-muenster").click();
    await page.getByTestId("mode-detektiv").click();
    await page.getByTestId("settings-continue").click();
    await page.getByTestId("mission-random").click();
    const screen = page.getByTestId("detektiv-screen");
    await expect(screen).toHaveAttribute("data-view", "pickSpawns");
    for (let i = 0; i < 4; i += 1) {
      await page.locator("[data-selectable='true']").first().click();
    }
    await expect(screen).toHaveAttribute("data-view", "playing");
    // The AI ganove has moved — the human squad is up; stable state.
    const before = await storeSnapshot(page);
    expect(before.phase).toBe("detektive");
    await page.getByTestId("save-button").click();

    await page.reload();
    await page.getByTestId("menu-resume").click();
    await page.locator("[data-resume-entry]").first().locator("button").first().click();
    await expect(page.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "playing");
    const after = await storeSnapshot(page);
    expect(after.detektivePositions).toEqual(before.detektivePositions);
    expect(after.round).toBe(before.round);
    expect(after.phase).toBe(before.phase);
    expect(after.activeDetectiveIndex).toBe(before.activeDetectiveIndex);
  });
});

test.describe("statistics & log management", () => {
  test("aggregates and per-log actions: delete one, clear all", async ({ page }) => {
    await recordBatch(page);
    const table = page.getByTestId("stats-table");
    const rowCount = await table.locator("tbody tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(5);
    const total = page.getByTestId("stats-total");
    await expect(total.locator('[data-field="games"]')).toHaveText(String(rowCount));

    // Delete the first listed entry — the row count drops by one.
    await page.locator("[data-log-row]").first().getByText("Löschen").click();
    await expect(table.locator("tbody tr")).toHaveCount(rowCount - 1);

    // Clear all with confirmation.
    await page.getByTestId("stats-clear-all").click();
    await expect(page.getByTestId("stats-clear-confirm")).toBeVisible();
    await page.getByTestId("stats-clear-yes").click();
    await expect(page.getByTestId("stats-empty")).toBeVisible();
  });

  test("log export downloads a JSONL file", async ({ page }) => {
    await recordBatch(page);
    const downloadPromise = page.waitForEvent("download");
    await page.locator("[data-log-row]").first().getByText("Exportieren").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^im-netz-der-detektive-.*\.jsonl$/);
  });
});

test.describe("replay player", () => {
  test("timeline steps deterministically; detective view hides the ganove", async ({ page }) => {
    await recordBatch(page);
    await page.locator("[data-log-row]").first().getByText("Replay").click();
    await expect(page.getByTestId("replay-screen")).toBeVisible();
    await expect(page.getByTestId("replay-position")).toHaveText(/Startaufstellung/);

    // Step forward changes the recorded state; step back restores it.
    const roundBefore = await page.getByTestId("round-indicator").textContent();
    await page.getByTestId("replay-next").click();
    const posText = await page.getByTestId("replay-position").textContent();
    expect(posText).toContain("Zug 1");
    await page.getByTestId("replay-prev").click();
    await expect(page.getByTestId("replay-position")).toHaveText(/Startaufstellung/);
    await expect(page.getByTestId("round-indicator")).toHaveText(roundBefore ?? "");

    // Detective perspective (default): no ganove marker ever.
    expect(await page.locator("[data-ganove]").count()).toBe(0);
    await page.getByTestId("replay-next").click();
    expect(await page.locator("[data-ganove]").count()).toBe(0);

    // Ganove perspective: the marker appears.
    await page.getByTestId("replay-view-ganove").click();
    expect(await page.locator("[data-ganove]").count()).toBe(1);
    await page.getByTestId("replay-view-detectives").click();
    expect(await page.locator("[data-ganove]").count()).toBe(0);

    // Back to the stats view.
    await page.getByTestId("replay-back").click();
    await expect(page.getByTestId("stats-screen")).toBeVisible();
  });

  test("play runs to the recorded end and shows the outcome", async ({ page }) => {
    await recordBatch(page);
    const logsBefore = await storedLogCount(page);
    await page.locator("[data-log-row]").first().getByText("Replay").click();
    await page.getByTestId("replay-play").click();
    await expect(page.getByTestId("replay-outcome")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("replay-next")).toBeDisabled();

    // A replayed game is already recorded — finishing it again must
    // not append a duplicate to the retained game-logs FIFO.
    expect(await storedLogCount(page)).toBe(logsBefore);
    await page.getByTestId("replay-back").click();
    await expect(page.getByTestId("stats-screen")).toBeVisible();
    await expect(page.locator("[data-log-row]")).toHaveCount(logsBefore);
  });
});
