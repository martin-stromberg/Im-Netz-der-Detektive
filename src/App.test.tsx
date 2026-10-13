import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import App from "./App";
import de from "./i18n/de.json";

describe("App", () => {
  it("renders the application shell with the localized title", () => {
    const html = renderToString(<App />);
    expect(html).toContain(de["app.title"]);
    expect(html).toContain(de["app.subtitle"]);
  });

  it("renders the current round from the game store", () => {
    const html = renderToString(<App />);
    expect(html).toContain("Runde 1");
  });
});
