import { expect, test } from "@playwright/test";

/**
 * Design-foundation checks: the OFL display font is embedded locally and
 * applied to headings on every screen family, and no external font/CDN
 * request ever leaves the page.
 */

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

test.describe("design fundament", () => {
  test("no external font requests on any screen", async ({ page }) => {
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      if (FONT_HOSTS.some((host) => request.url().includes(host))) {
        externalRequests.push(request.url());
      }
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(externalRequests).toEqual([]);
  });

  test("headings use the display font on menu and game screens", async ({ page }) => {
    await page.goto("/");

    const menuHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(menuHeading).toBeVisible();
    const menuFont = await menuHeading.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(menuFont).toContain("IM Fell English");

    // Game screen family: the ganove setup screen renders its own
    // `styles.title` h1 — same shared class contract as the live board.
    await page.goto("/?mode=ganove&map=teststadt&seed=7&mission=none");
    const gameHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(gameHeading).toBeVisible();
    const gameFont = await gameHeading.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(gameFont).toContain("IM Fell English");
  });

  test("theme custom properties are defined on :root", async ({ page }) => {
    await page.goto("/");

    const tokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        screenBg: styles.getPropertyValue("--color-screen-bg").trim(),
        panelBg: styles.getPropertyValue("--color-panel-bg").trim(),
        paper: styles.getPropertyValue("--color-paper").trim(),
        ink: styles.getPropertyValue("--color-ink").trim(),
        fontDisplay: styles.getPropertyValue("--font-display").trim(),
      };
    });

    expect(tokens.screenBg).toBe("#0c0f16");
    expect(tokens.panelBg).toBe("#161b26");
    expect(tokens.paper).toBe("#e8dcc0");
    expect(tokens.ink).toBe("#2b2115");
    expect(tokens.fontDisplay).toContain("IM Fell English");
  });

  test("map renders as a parchment board with rim and drop shadow", async ({ page }) => {
    // muenster ships board features, so data-layer="board" renders too.
    await page.goto("/?mode=ganove&map=muenster&seed=7&mission=none");
    await page.getByRole("button", { name: "Neue Partie" }).click();
    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
    const board = page.getByTestId("map-graph");
    await expect(board).toBeVisible();

    const face = await board.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        background: style.backgroundColor,
        shadow: style.boxShadow,
        borderWidth: Number.parseFloat(style.borderTopWidth),
        radius: Number.parseFloat(style.borderTopLeftRadius),
        hasGrain: el.querySelector("filter feTurbulence") !== null,
        hasVignette: el.querySelector("radialGradient") !== null,
        hasBoardLayer: el.querySelector('[data-layer="board"]') !== null,
      };
    });

    // Paper face in --color-paper (#e8dcc0), cardboard rim, table shadow.
    expect(face.background).toBe("rgb(232, 220, 192)");
    expect(face.shadow).not.toBe("none");
    expect(face.borderWidth).toBeGreaterThanOrEqual(5);
    expect(face.radius).toBeGreaterThan(0);
    expect(face.hasGrain).toBe(true);
    expect(face.hasVignette).toBe(true);
    expect(face.hasBoardLayer).toBe(true);

    // Place labels must be dark ink on the light paper (WCAG AA).
    const labelFill = await board
      .locator("text")
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    const channel = labelFill.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(channel).not.toBeNull();
    const [r, g, b] = [Number(channel?.[1]), Number(channel?.[2]), Number(channel?.[3])];
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    expect(luminance).toBeLessThan(0.4);
  });

  test("places render as embossed plaque tokens with legend mirror", async ({ page }) => {
    await page.goto("/?mode=ganove&map=muenster&seed=7&mission=none");
    await page.getByRole("button", { name: "Neue Partie" }).click();
    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
    const board = page.getByTestId("map-graph");
    await expect(board).toBeVisible();

    const token = await board
      .locator("[data-node-id]")
      .first()
      .evaluate((el) => {
        const group = el.querySelector("g[class*='nodeToken']");
        const rim = el.querySelector("[class*='tokenRim']");
        const face = el.querySelector("[class*='tokenFace']");
        const shadow = el.querySelector("[class*='tokenShadow']");
        const rimStyle = rim ? getComputedStyle(rim) : null;
        return {
          hasToken: group !== null,
          rimStroke: rimStyle?.stroke ?? null,
          rimWidth: rimStyle ? Number.parseFloat(rimStyle.strokeWidth) : 0,
          faceFill: face?.getAttribute("fill") ?? null,
          shadowOpacity: shadow ? Number.parseFloat(getComputedStyle(shadow).fillOpacity) : 1,
          hasFlatDot: el.querySelector("[class*='nodeDot']") !== null,
        };
      });

    // Plaque anatomy: framed rim, gradient-embossed face, soft shadow,
    // and no leftover flat dot.
    expect(token.hasToken).toBe(true);
    expect(token.rimWidth).toBeGreaterThanOrEqual(1);
    expect(token.faceFill).toMatch(/url\(#.*tokenFace\)/);
    expect(token.shadowOpacity).toBeLessThan(1);
    expect(token.hasFlatDot).toBe(false);

    // The legend swatch mirrors the plaque: same ring+rim+inner anatomy.
    const legend = page.getByTestId("map-legend");
    await expect(legend.locator("[class*='legendTargetDot']")).toHaveCount(1);
    await expect(legend.locator("[class*='legendTargetRing']")).toHaveCount(1);
    await expect(legend.locator("[class*='legendTargetInner']")).toHaveCount(1);

    // Keyboard focus keeps the amber ring — now on the token rim.
    // Tabbing in (not .focus()) guarantees :focus-visible applies.
    let focused = false;
    for (let i = 0; i < 60 && !focused; i += 1) {
      await page.keyboard.press("Tab");
      focused = await page.evaluate(
        () => document.activeElement?.getAttribute("data-selectable") === "true",
      );
    }
    expect(focused).toBe(true);
    const focusStroke = await page.evaluate(
      () => getComputedStyle(document.activeElement!.querySelector("[class*='tokenRim']")!).stroke,
    );
    expect(focusStroke).toBe("rgb(125, 82, 16)"); // --color-map-accent
  });

  test("routes draw as cased map paths with legend mirror", async ({ page }) => {
    // teststadt: 12 weg edges + the single fahrt edge f–g.
    await page.goto("/?mode=ganove&map=teststadt&seed=7&mission=none");
    await page.getByRole("button", { name: "Neue Partie" }).click();
    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
    const board = page.getByTestId("map-graph");
    await expect(board).toBeVisible();

    const routes = await board.evaluate((el) => {
      const readRoute = (selector: string) => {
        const group = el.querySelector(selector);
        const strokes = group
          ? [...group.children].filter((child) => child.tagName === "line")
          : [];
        const casing = strokes[0] ? getComputedStyle(strokes[0]) : null;
        const core = strokes[1] ? getComputedStyle(strokes[1]) : null;
        return {
          strokeCount: strokes.length,
          casingStroke: casing?.stroke ?? null,
          casingWidth: casing ? Number.parseFloat(casing.strokeWidth) : 0,
          casingCap: casing?.strokeLinecap ?? null,
          coreStroke: core?.stroke ?? null,
          coreWidth: core ? Number.parseFloat(core.strokeWidth) : 0,
          coreDash: core?.strokeDasharray ?? null,
          coreCap: core?.strokeLinecap ?? null,
        };
      };
      return {
        weg: readRoute('[data-edge="a-b"]'),
        fahrt: readRoute('[data-edge="f-g"]'),
      };
    });

    // weg: a surfaced road — dark sepia casing under a solid,
    // paper-bright core with rounded ends.
    expect(routes.weg.strokeCount).toBe(2);
    expect(routes.weg.casingStroke).toBe("rgb(107, 91, 67)"); // --color-map-weg
    expect(routes.weg.casingWidth).toBeGreaterThan(routes.weg.coreWidth);
    expect(routes.weg.casingCap).toBe("round");
    expect(routes.weg.coreStroke).toBe("rgb(232, 220, 192)"); // --color-paper
    expect(routes.weg.coreDash).toBe("none");

    // fahrt: a stronger track — wider casing plus butt-capped paper
    // sleepers (a pattern, not just another dasharray on a wire).
    expect(routes.fahrt.casingStroke).toBe("rgb(122, 82, 40)"); // --color-map-fahrt
    expect(routes.fahrt.casingWidth).toBeGreaterThan(routes.weg.casingWidth);
    expect(routes.fahrt.coreStroke).toBe("rgb(232, 220, 192)");
    expect(routes.fahrt.coreDash).not.toBe("none");
    expect(routes.fahrt.coreCap).toBe("butt");

    // The legend chips mirror the route anatomy — casing behind core.
    const legend = page.getByTestId("map-legend");
    await expect(legend.locator("line[class*='legendWegCasing']")).toHaveCount(1);
    await expect(legend.locator("line[class*='legendFahrtCasing']")).toHaveCount(1);
    const legendCore = legend.locator("line[class*='legendFahrt']:not([class*='Casing'])");
    await expect(legendCore).toHaveCount(1);
    const swatch = await legendCore.evaluate((el) => {
      const style = getComputedStyle(el);
      return { stroke: style.stroke, dash: style.strokeDasharray, cap: style.strokeLinecap };
    });
    expect(swatch.stroke).toBe("rgb(232, 220, 192)"); // --color-paper
    expect(swatch.dash).not.toBe("none");
    expect(swatch.cap).toBe("butt");

    // The edge-flash pulse still honours prefers-reduced-motion: the
    // animation rule on the flash class is switched off for reduced
    // motion — verified on the stylesheet the flash class comes from.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const flashAnimationOff = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (!(rule instanceof CSSMediaRule)) {
              continue;
            }
            if (!rule.conditionText.includes("prefers-reduced-motion")) {
              continue;
            }
            for (const inner of rule.cssRules) {
              if (
                inner instanceof CSSStyleRule &&
                inner.selectorText.includes("edgeFlash") &&
                inner.style.animationName === "none"
              ) {
                return true;
              }
            }
          }
        } catch {
          // cross-origin sheets are not readable — skip
        }
      }
      return false;
    });
    expect(flashAnimationOff).toBe(true);
  });

  test("game pieces stand as shaded meeples with distinct silhouettes", async ({ page }) => {
    // Ganove spawn choice already shows the placed detective squad.
    await page.goto("/?mode=ganove&map=muenster&seed=7&mission=none");
    await page.getByRole("button", { name: "Neue Partie" }).click();
    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
    const board = page.getByTestId("map-graph");
    await expect(board).toBeVisible();

    // Detective piece anatomy: gradient body, soft shadow, pedestal,
    // head, index numeral — readable ink on the parchment.
    const detective = await board
      .locator("[data-detective='0']")
      .first()
      .evaluate((el) => {
        const body = el.querySelector("[class*='pieceBody']");
        const shadow = el.querySelector("[class*='pieceShadow']");
        const index = el.querySelector("[class*='pieceIndex']");
        const wrapper = getComputedStyle(el);
        return {
          piece: el.querySelector("[data-piece='detective']") !== null,
          bodyFill: body?.getAttribute("fill") ?? null,
          head: el.querySelector("[class*='pieceHead']") !== null,
          base: el.querySelector("[class*='pieceBase']") !== null,
          shadowOpacity: shadow ? Number.parseFloat(getComputedStyle(shadow).fillOpacity) : 1,
          indexText: index?.textContent ?? null,
          indexFill: index ? getComputedStyle(index).fill : null,
          transitionProperty: wrapper.transitionProperty,
          transitionDuration: wrapper.transitionDuration,
        };
      });
    expect(detective.piece).toBe(true);
    expect(detective.bodyFill).toMatch(/url\(#.*body\)/);
    expect(detective.head).toBe(true);
    expect(detective.base).toBe(true);
    expect(detective.shadowOpacity).toBeLessThan(1);
    expect(detective.indexText).toBe("1");
    expect(detective.indexFill).toBe("rgb(234, 240, 248)"); // --color-text
    // The glide transition lives on the moving wrapper.
    expect(detective.transitionProperty).toContain("transform");
    expect(detective.transitionDuration).toBe("0.48s");

    // The legend mirrors the pieces — same silhouettes, scaled down.
    const legend = page.getByTestId("map-legend");
    await expect(legend.locator("[data-piece='detective']")).toHaveCount(1);
    await expect(legend.locator("[data-piece='ganove']")).toHaveCount(1);

    // After the spawn pick the ganove stands as coat + fedora — a
    // silhouette distinct from the detective (hat, no head, no index).
    await page.locator("[data-selectable]").first().dispatchEvent("click");
    await expect(page.getByTestId("ganove-screen")).toHaveAttribute("data-view", "playing");
    const ganove = await page.locator("[data-ganove]").evaluate((el) => ({
      piece: el.querySelector("[data-piece='ganove']") !== null,
      hat: el.querySelector("[class*='pieceHat']") !== null,
      head: el.querySelector("[class*='pieceHead']") !== null,
      index: el.querySelector("[class*='pieceIndex']") !== null,
    }));
    expect(ganove.piece).toBe(true);
    expect(ganove.hat).toBe(true);
    expect(ganove.head).toBe(false);
    expect(ganove.index).toBe(false);

    // The active detective plants an amber pennant (shape + colour).
    await page.goto("/?mode=detektiv&map=teststadt&seed=42&mission=random");
    await page.getByRole("button", { name: "Neue Partie" }).click();
    await expect(page.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "pickSpawns");
    await page.locator("[data-selectable]").first().dispatchEvent("click");
    const flag = await page.locator("[data-active-detective='true']").evaluate((el) => {
      // `path`, not `line` — `pieceFlagPole` shares the class prefix.
      const pennant = el.querySelector("path[class*='pieceFlag']");
      return {
        mark: el.querySelector("[class*='pieceActiveMark']") !== null,
        flagFill: pennant ? getComputedStyle(pennant).fill : null,
      };
    });
    expect(flag.mark).toBe(true);
    expect(flag.flagFill).toBe("rgb(125, 82, 16)"); // --color-map-accent

    // Reduced motion switches the glide off.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await page
      .locator("[data-detective]")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(reduced).toBe("0s");
  });
});
