import { expect, test, type Page } from "@playwright/test";

/**
 * E2E user flow for the ganove perspective. Determinism comes from the
 * `?map=`/`?seed=` URL params; `window.__gameStore` (DEV-only exposure)
 * is used solely to *read* state for route planning — every action the
 * test takes goes through real DOM interaction (clicks/keys).
 */

// Node `process` is ambient at test runtime but not typed here (the
// tsconfig does not pull in @types/node).
declare const process: { env: Record<string, string | undefined> };

interface Snapshot {
  phase: "ganove" | "detektive";
  round: number;
  roundLimit: number | null;
  outcome: string | null;
  ganovePosition: string | null;
  detektivePositions: string[];
  legalMoves: { nodeId: string; edgeType: string }[];
  missionAction: string | null;
  pendingChoice: { sabotageNode: string; effect: string } | null;
  missionStage: string | null;
  currentTarget: string | null;
  blockedEdges: { a: string; b: string; untilRound: number }[];
  edges: { a: string; b: string; type: string }[];
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
      roundLimit: number | null;
      outcome: string | null;
      ganovePosition: string | null;
      detektivePositions: string[];
      blockedEdges: { a: string; b: string; untilRound: number }[];
      mission: {
        stage: string;
        pendingChoice: { sabotageNode: string; effect: string } | null;
        targets: Record<string, string | null>;
      } | null;
      map: { edges: { a: string; b: string; type: string }[] };
      getLegalGanoveMoves: () => { nodeId: string; edgeType: string }[];
      getMissionAction: () => string | null;
    };
    const targets = s.mission?.targets ?? null;
    const currentTarget =
      s.mission === null
        ? null
        : s.mission.stage === "diebstahl"
          ? targets?.diebstahl
          : s.mission.stage === "kontakt"
            ? targets?.kontakt
            : s.mission.stage === "sabotage"
              ? targets?.sabotage
              : s.mission.stage === "flucht"
                ? targets?.flucht
                : null;
    return {
      phase: s.phase,
      round: s.round,
      roundLimit: s.roundLimit,
      outcome: s.outcome,
      ganovePosition: s.ganovePosition,
      detektivePositions: s.detektivePositions,
      legalMoves: s.getLegalGanoveMoves(),
      missionAction: s.getMissionAction(),
      pendingChoice: s.mission?.pendingChoice ?? null,
      missionStage: s.mission?.stage ?? null,
      currentTarget: currentTarget ?? null,
      blockedEdges: s.blockedEdges,
      edges: s.map.edges,
    };
  });
}

/**
 * Waits until the stepped detective phase hands back to the ganove (or
 * the game ended). The driver paces one detective per beat, so the
 * phase needs real time — polling the store snapshot beats fixed waits.
 */
async function waitForGanoveTurn(page: Page): Promise<Snapshot> {
  let latest: Snapshot | undefined;
  await expect
    .poll(
      async () => {
        latest = await snapshot(page);
        return latest.outcome !== null || latest.phase === "ganove";
      },
      { timeout: 15_000, intervals: [200] },
    )
    .toBe(true);
  return latest as Snapshot;
}

function openAdjacency(state: Snapshot): Map<string, string[]> {
  const blocked = (a: string, b: string) =>
    state.blockedEdges.some(
      (e) => e.untilRound >= state.round && ((e.a === a && e.b === b) || (e.a === b && e.b === a)),
    );
  const adjacency = new Map<string, string[]>();
  for (const edge of state.edges) {
    if (blocked(edge.a, edge.b)) {
      continue;
    }
    adjacency.set(edge.a, [...(adjacency.get(edge.a) ?? []), edge.b]);
    adjacency.set(edge.b, [...(adjacency.get(edge.b) ?? []), edge.a]);
  }
  return adjacency;
}

/** BFS distances over currently open edges; `from` maps to 0. */
function distances(state: Snapshot, from: string): Map<string, number> {
  const adjacency = openAdjacency(state);
  const dist = new Map<string, number>([[from, 0]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head];
    for (const next of adjacency.get(cur) ?? []) {
      if (!dist.has(next)) {
        dist.set(next, (dist.get(cur) ?? 0) + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}

/** Smallest detective distance of a node; Infinity when unreachable. */
function detectiveGap(state: Snapshot, node: string): number {
  let best = Infinity;
  for (const pos of state.detektivePositions) {
    const d = distances(state, pos).get(node) ?? Infinity;
    if (d < best) {
      best = d;
    }
  }
  return best;
}

/**
 * Picks a legal move like a cautious player: never step next to a
 * detective when avoidable, otherwise prefer progress towards the
 * current mission target and keep maximum distance to the squad.
 */
function pickMove(state: Snapshot): string | null {
  const legal = state.legalMoves.map((m) => m.nodeId);
  if (legal.length === 0 || state.ganovePosition === null) {
    return null;
  }
  const targetDist = state.currentTarget !== null ? distances(state, state.currentTarget) : null;
  const scored = legal.map((nodeId) => ({
    nodeId,
    gap: detectiveGap(state, nodeId),
    toTarget: targetDist?.get(nodeId) ?? Infinity,
  }));
  const safe = scored.filter((m) => m.gap > 1);
  const pool = safe.length > 0 ? safe : scored;
  pool.sort((a, b) => a.toTarget - b.toTarget || b.gap - a.gap || a.nodeId.localeCompare(b.nodeId));
  return pool[0].nodeId;
}

async function startGameViaUi(page: Page, query: string) {
  await page.goto(`/?mode=ganove&${query}`);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
  // Pick the first offered (legal) spawn.
  await page.locator("[data-selectable]").first().click();
  await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "playing");
}

test.describe("ganove perspective", () => {
  test("setup: detectives placed first, ganove picks from legal options only", async ({ page }) => {
    await page.goto("/?mode=ganove&map=teststadt&seed=42&mission=none");
    await page.getByRole("button", { name: "Neue Partie" }).click();

    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
    await expect(page.locator("[data-detective]")).toHaveCount(4);
    const selectable = page.locator("[data-selectable]");
    const count = await selectable.count();
    expect(count).toBeGreaterThan(0);
    // Non-selectable nodes are not interactive.
    const plain = page.locator("[data-node-id]:not([data-selectable])").first();
    await expect(plain).not.toHaveAttribute("role", "button");

    // Keyboard: Tab to a selectable node, Enter picks it.
    await page.locator("[data-selectable]").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "playing");
    await expect(page.getByTestId("phase-indicator")).toHaveText("Du bist am Zug");
    await expect(page.getByTestId("round-indicator")).toContainText("1");
    await expect(page.getByRole("status", { name: /Polizeiaufmerksamkeit/ })).toContainText(
      "Polizeiaufmerksamkeit",
    );
    await expect(page.getByTestId("radio-button")).toBeEnabled();
    await expect(page.locator("[data-ganove]")).toHaveCount(1);
    await expect(page.locator("[data-legal-target]").first()).toBeVisible();
  });

  test("a move triggers the automatic AI detective phase", async ({ page }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=none");
    const before = await snapshot(page);
    const target = pickMove(before);
    expect(target).not.toBeNull();

    await page.locator(`[data-node-id="${target}"]`).click();

    const after = await waitForGanoveTurn(page);
    expect(after.phase).toBe("ganove");
    expect(after.round).toBe(before.round + 1);
    expect(after.ganovePosition).toBe(target);
    expect(after.detektivePositions).not.toEqual(before.detektivePositions);
    // Asymmetry: no camera elements, no detective-hint artifacts anywhere.
    await expect(page.locator("[data-camera]")).toHaveCount(0);
    await expect(page.locator("[data-hint-event]")).toHaveCount(0);
  });

  test("complete game with mission runs to escape (ganove win)", async ({ page }) => {
    test.setTimeout(180_000);
    // Deterministic seed: the cautious clicker completes the full
    // mission (heist → contact → sabotage choice → sabotage → escape).
    // Seed 3 survives the sharper post-playtest pursuit; seed 19 timed
    // out once the squad actually hunts on fresh trails.
    const seed = process.env.E2E_GANOVE_SEED ?? "3";
    await startGameViaUi(page, `map=muenster&seed=${seed}&mission=random`);

    let steps = 0;
    let sawChoice = false;
    let actionsTaken = 0;
    for (;;) {
      let state = await snapshot(page);
      if (state.outcome !== null || steps > 200) {
        break;
      }
      // The squad is still moving — wait for the handover.
      if (state.phase === "detektive") {
        state = await waitForGanoveTurn(page);
        if (state.outcome !== null) {
          break;
        }
      }
      steps += 1;
      if (state.pendingChoice !== null) {
        // Exercise the sabotage branch — the offer shows effect + node.
        sawChoice = true;
        await expect(page.getByTestId("mission-choice")).toBeVisible();
        await page.locator('[data-choice="sabotage"]').click();
        continue;
      }
      if (state.missionAction !== null) {
        actionsTaken += 1;
        await page.getByTestId("mission-action").click();
        continue;
      }
      const target = pickMove(state);
      if (target === null) {
        // Should not happen (engine ends surrounded games) — fail loudly.
        throw new Error("no legal move and no outcome");
      }
      await page.locator(`[data-node-id="${target}"]`).click();
    }

    // The deterministic run proves the full mission action flow in the
    // real browser: heist + contact + sabotage actions and the binary
    // informant choice were all exercised via DOM interaction.
    expect(actionsTaken).toBeGreaterThanOrEqual(3);
    expect(sawChoice).toBe(true);

    const outcome = page.getByTestId("outcome-panel");
    await expect(outcome).toBeVisible();
    await expect(outcome).toHaveAttribute("data-outcome", "escaped");
    await expect(outcome).toContainText("Entkommen");
    // Diagnostics: keeps the reached outcome/rounds visible in the log.
    const finalState = await snapshot(page);
    console.log(
      `full game finished: outcome=${finalState.outcome} round=${finalState.round} ` +
        `stage=${finalState.missionStage} steps=${steps}`,
    );
    expect(finalState.missionStage).toBe("flucht");
    await expect(page.locator("[data-camera]")).toHaveCount(0);
    await expect(page.locator("[data-hint-event]")).toHaveCount(0);
  });

  test("a lost game shows a non-escape outcome", async ({ page }) => {
    test.setTimeout(180_000);
    // Seed 9 is deterministic under the step-14 balancing: the AI
    // catches the clicker mid-mission.
    await startGameViaUi(page, "map=muenster&seed=9&mission=random");

    let steps = 0;
    for (;;) {
      let state = await snapshot(page);
      if (state.outcome !== null || steps > 200) {
        break;
      }
      // The squad is still moving — wait for the handover.
      if (state.phase === "detektive") {
        state = await waitForGanoveTurn(page);
        if (state.outcome !== null) {
          break;
        }
      }
      steps += 1;
      if (state.pendingChoice !== null) {
        await page.locator('[data-choice="flucht"]').click();
        continue;
      }
      if (state.missionAction !== null) {
        await page.getByTestId("mission-action").click();
        continue;
      }
      const target = pickMove(state);
      if (target === null) {
        throw new Error("no legal move and no outcome");
      }
      await page.locator(`[data-node-id="${target}"]`).click();
    }

    const outcome = page.getByTestId("outcome-panel");
    await expect(outcome).toBeVisible();
    const value = await outcome.getAttribute("data-outcome");
    expect(["caught", "surrounded", "timeout"]).toContain(value);
  });

  test("police radio works once; abort ends the game as draw", async ({ page }) => {
    await startGameViaUi(page, "map=teststadt&seed=42&mission=none");

    await page.getByTestId("radio-button").click();
    await expect(page.getByTestId("radio-button")).toBeDisabled();
    await expect(page.getByTestId("radio-button")).toContainText("bereits abgehört");

    await page.getByTestId("abort-button").click();
    await page.getByTestId("abort-yes").click();
    await expect(page.getByTestId("outcome-panel")).toHaveAttribute("data-outcome", "draw");
    await expect(
      page.getByTestId("outcome-panel").getByText("Remis — die Partie wurde beendet."),
    ).toBeVisible();
  });
});
