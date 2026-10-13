// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import de from "./i18n/de.json";

describe("App", () => {
  it("renders the application shell with the localized title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: de["app.title"] })).toBeInTheDocument();
    expect(screen.getByText(de["app.subtitle"])).toBeInTheDocument();
  });

  it("shows the ganove start view with the new-game action", () => {
    render(<App />);
    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "idle");
    expect(screen.getByRole("button", { name: de["game.new"] })).toBeInTheDocument();
  });
});
