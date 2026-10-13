// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import de from "./i18n/de.json";

function setSearch(search: string) {
  window.history.pushState({}, "", `/${search}`);
}

describe("App", () => {
  beforeEach(() => {
    setSearch("");
  });

  it("renders the temporary mode chooser without a mode parameter", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: de["app.title"] })).toBeInTheDocument();
    expect(screen.getByText(de["app.subtitle"])).toBeInTheDocument();
    expect(screen.getByTestId("mode-select")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(de["mode.ganove"]) })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(de["mode.detektiv"]) }),
    ).toBeInTheDocument();
  });

  it("opens the ganove start view when the ganove mode is picked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(de["mode.ganove"]) }));
    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "idle");
    expect(screen.getByRole("button", { name: de["game.new"] })).toBeInTheDocument();
  });

  it("opens the detektiv start view when the detective mode is picked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(de["mode.detektiv"]) }));
    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "idle");
    expect(screen.getByRole("button", { name: de["game.new"] })).toBeInTheDocument();
  });

  it("renders the ganove screen directly with ?mode=ganove", () => {
    setSearch("?mode=ganove");
    render(<App />);
    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "idle");
  });

  it("renders the detektiv screen directly with ?mode=detektiv", () => {
    setSearch("?mode=detektiv");
    render(<App />);
    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "idle");
  });
});
