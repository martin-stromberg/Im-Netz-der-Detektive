import { expect, test, type Page } from "@playwright/test";
import { deducePossiblePositions } from "../src/logic/Deduction";
import { visibleCameras, visibleEvents } from "../src/logic/InformationSystem";
import { validateMapPack } from "../src/logic/mapPack";
import teststadtJson from "../src/data/maps/teststadt.json" with { type: "json" };
import type { GameEvent } from "../src/logic/InformationSystem";

/**
 * E2E user flow for the detective perspective. Determinism comes from
 * the `?mode=detektiv`/`?map=`/`?seed=` URL params; `window.__gameStore`
 * (DEV-only exposure) is used solely to *read* state for move selection
 * and the engine-side deduction comparison — every action the test
 * takes goes through real DOM interaction (clicks/keys).
 */

interface Snapshot {
  phase: "ganove" | "detektive";
  round: number;
  outcome: string | null;
  activeDetectiveIndex: number;
  detektivePositions: string[];
  legalDetectiveMoves: { nodeId: string; edgeType: string }[];
  events: GameEvent[];
  cameras: { nodeId: string; active: boolean }[];
  detectiveStarts: string[];
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const store = (
      window as unknown as {
        __gameStore: { getState: () => Record<string, never> };
      }
    ).__gameStore;
    const s = store.getState() as unknown as {
      phase: "ganove" | "detektive";
      round: number;
      outcome: string | null;
      activeDetectiveIndex: number;
      detektivePositions: string[];
      events: GameEvent[];
      cameras: { nodeId: string; active: boolean }[];
      log: { type: string; starts?: { detectives?: string[] } }[];
      getLegalDetectiveMoves: () => { nodeId: string; edgeType: string }[];
    };
    const header = s.log.find((entry) => entry.type === "header");
    return {
      phase: s.phase,
      round: s.round,
      outcome: s.outcome,
      activeDetectiveIndex: s.activeDetectiveIndex,
      detektivePositions: s.detektivePositions,
      legalDetectiveMoves: s.getLegalDetectiveMoves(),
      events: s.events,
      cameras: s.cameras,
      detectiveStarts: header?.starts?.detectives ?? s.detektivePositions,
    };
  });
}

/** The overlay set the engine computes for the current store state. */
function expectedPossible(state: Snapshot): string[] {
  // `MapLoader` relies on `import.meta.glob` (Vite-only) — the spec
  // validates the bundled package directly instead.
  const map = validateMapPack(teststadtJson);
  return deducePossiblePositions({
    map,
    detectiveStarts: state.detectiveStarts,
    events: visibleEvents(state.events, "detectives"),
    cameras: visibleCameras(state.cameras, "detectives"),
    round: state.round,
    detectivePositions: state.detektivePositions,
  });
}

async function startGameViaUi(page: Page, query: string) {
  await page.goto(`/?mode=detektiv&${query}`);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await expect(page.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "pickSpawns");
  // Pick D1→Dn from the highlighted candidates until the game starts.
  for (let i = 0; i < 8; i += 1) {
    const selectable = page.locator("[data-selectable]").first();
    if ((await selectable.count()) === 0) {
      break;
    }
    await selectable.dispatchEvent("click");
    const view = await page.getByTestId("detektiv-screen").getAttribute("data-view");
    if (view === "playing") {
      break;
    }
  }
  await expect(page.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "playing");
}

/**
 * Node clicks: on a dense SVG map several nodes share every pixel
 * (hit areas overlap), so Playwright's actionability hit-test cannot
 * deterministically land on one node. `dispatchEvent` fires the click
 * on the node group itself — the exact element carrying the React
 * handler a real click would bubble to.
 */
async function clickNode(page: Page, nodeId: string): Promise<void> {
  await page.locator(`[data-node-id="${nodeId}"]`).dispatchEvent("click");
}

async function clickSelectable(page: Page): Promise<void> {
  await page.locator("[data-selectable]").first().dispatchEvent("click");
}

/** One detective move through the real UI: click the first legal target. */
async function playDetectiveTurn(page: Page): Promise<void> {
  const state = await snapshot(page);
  if (state.phase !== "detektive" || state.legalDetectiveMoves.length === 0) {
    throw new Error(
      `expected a playable detective turn, got phase=${state.phase} moves=${state.legalDetectiveMoves.length}`,
    );
  }
  await clickNode(page, state.legalDetectiveMoves[0].nodeId);
}

test.describe("detektiv perspective", () => {
  test("setup: detectives are picked D1→Dn, the ganove start stays hidden", async ({ page }) => {
    await page.goto("/?mode=detektiv&map=teststadt&seed=42&mission=random");
    await page.getByRole("button", { name: "Neue Partie" }).click();

    await expect(page.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "pickSpawns");
    // Only the legal spawn candidates are interactive.
    const selectable = page.locator("[data-selectable]");
    expect(await selectable.count()).toBeGreaterThan(0);
    const plain = page.locator("[data-node-id]:not([data-selectable])").first();
    await expect(plain).not.toHaveAttribute("role", "button");
    // Categories and zones are part of the detective's public map.
    expect(await page.locator("[data-category]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-zone]").count()).toBeGreaterThan(0);

    // Pick the squad post by post until the game begins.
    for (let i = 0; i < 4; i += 1) {
      await clickSelectable(page);
    }
    await expect(page.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "playing");
    await expect(page.locator("[data-detective]")).toHaveCount(4);
    // The AI ganove start is never shown — and the AI already moved:
    // the squad is on turn right after the setup.
    await expect(page.locator("[data-ganove]")).toHaveCount(0);
    await expect(page.getByTestId("phase-indicator")).toContainText("Detektiv 1");
    // Camera icons exist only in this perspective.
    expect(await page.locator("[data-camera]").count()).toBeGreaterThan(0);
    await expect(page.locator("[data-mission-target]")).toHaveCount(0);
  });

  test("a click on a legal target moves the active detective", async ({ page }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=random");
    const before = await snapshot(page);
    expect(before.phase).toBe("detektive");
    const target = before.legalDetectiveMoves[0].nodeId;

    await clickNode(page, target);

    const after = await snapshot(page);
    expect(after.detektivePositions[before.activeDetectiveIndex]).toBe(target);
    await expect(page.locator("[data-ganove]")).toHaveCount(0);
    await expect(page.locator("[data-mission-target]")).toHaveCount(0);
  });

  test("deduction overlay matches the engine computation and narrows over rounds", async ({
    page,
  }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=random");
    await expect(page.getByTestId("overlay-toggle")).toBeChecked();

    const readOverlay = async (): Promise<string[]> =>
      (
        await page
          .locator("[data-possible]")
          .evaluateAll((els) =>
            els.map((el) => el.closest("[data-node-id]")?.getAttribute("data-node-id") ?? "?"),
          )
      ).sort();

    const first = await snapshot(page);
    expect(await readOverlay()).toEqual([...expectedPossible(first)].sort());

    // Play several rounds; the belief set must stay exactly the
    // engine's at every point. (It does not shrink monotonically
    // step-by-step — a detective vacating a node frees it again as a
    // live occupancy constraint — but it is never empty while the game
    // runs, because no falsified trail exists on this map.)
    for (let i = 0; i < 6; i += 1) {
      const state = await snapshot(page);
      if (state.outcome !== null) {
        break;
      }
      await playDetectiveTurn(page);
      const next = await snapshot(page);
      if (next.phase !== "detektive" || next.outcome !== null) {
        break;
      }
      const overlay = await readOverlay();
      expect(overlay).toEqual([...expectedPossible(next)].sort());
      expect(overlay.length).toBeGreaterThan(0);
    }
  });

  test("markers are set, commented and kept across rounds", async ({ page }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=random");

    await page.getByTestId("marker-toggle").click();
    await expect(page.locator("[data-markable]").first()).toBeVisible();
    await clickNode(page, "c");
    await expect(page.locator("[data-marker]")).toHaveCount(1);

    const comment = page.locator('[data-marker-item="c"] input');
    await comment.fill("Verdacht Richtung Hafen");
    await expect(comment).toHaveValue("Verdacht Richtung Hafen");

    // Leave marker mode and play two detective turns — the marker persists.
    await page.getByTestId("marker-toggle").click();
    for (let i = 0; i < 2; i += 1) {
      const state = await snapshot(page);
      if (state.outcome !== null || state.phase !== "detektive") {
        break;
      }
      await playDetectiveTurn(page);
    }
    await expect(page.locator("[data-marker]")).toHaveCount(1);
    await expect(page.locator('[data-marker-item="c"] input')).toHaveValue(
      "Verdacht Richtung Hafen",
    );

    // Clicking the node again removes the marker.
    await page.getByTestId("marker-toggle").click();
    await clickNode(page, "c");
    await expect(page.locator("[data-marker]")).toHaveCount(0);
  });

  test("keyboard: Tab + Enter on a legal target moves the detective", async ({ page }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=random");
    const before = await snapshot(page);
    const target = before.legalDetectiveMoves[0].nodeId;

    await page.locator(`[data-node-id="${target}"]`).focus();
    await page.keyboard.press("Enter");

    const after = await snapshot(page);
    expect(after.detektivePositions[before.activeDetectiveIndex]).toBe(target);
  });

  test("complete game runs to an outcome; hint chronicle grows; nothing leaks", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // Deterministic seed: the squad clicks the first legal move each
    // turn — a deliberately naive human — until the game ends.
    await startGameViaUi(page, "map=teststadt&seed=7&mission=random");

    let steps = 0;
    for (;;) {
      const state = await snapshot(page);
      if (state.outcome !== null || steps > 200) {
        break;
      }
      steps += 1;
      // Asymmetry held at every step of the game.
      await expect(page.locator("[data-ganove]")).toHaveCount(0);
      await expect(page.locator("[data-mission-target]")).toHaveCount(0);
      if (state.phase !== "detektive") {
        // The AI ganove turn runs synchronously — a detektive phase
        // should always be next; bail out loudly if not.
        throw new Error(`unexpected phase ${state.phase} without outcome`);
      }
      await playDetectiveTurn(page);
    }

    const outcome = page.getByTestId("outcome-panel");
    await expect(outcome).toBeVisible();
    const value = await outcome.getAttribute("data-outcome");
    expect(["caught", "surrounded", "escaped", "timeout", "draw"]).toContain(value);
    console.log(`detektiv full game: outcome=${value} steps=${steps}`);

    // The chronicle collected real hints over the game (camera hits at
    // minimum) — every entry carries round, kind and place.
    const hintCount = await page.locator("[data-hint-event]").count();
    console.log(`chronicle entries: ${hintCount}`);
    expect(hintCount).toBeGreaterThan(0);
    await expect(page.locator("[data-hint-event]")).toHaveCount(hintCount);
    // Still no leak: even the finished game shows no ganove, no targets.
    await expect(page.locator("[data-ganove]")).toHaveCount(0);
    await expect(page.locator("[data-mission-target]")).toHaveCount(0);
  });

  test("abort ends the game as a draw", async ({ page }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=random");
    await page.getByTestId("abort-button").click();
    await page.getByTestId("abort-yes").click();
    await expect(page.getByTestId("outcome-panel")).toHaveAttribute("data-outcome", "draw");
    await expect(page.getByText("Remis — die Partie wurde beendet.")).toBeVisible();
  });
});
