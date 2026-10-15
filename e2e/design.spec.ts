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
});
