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
});
