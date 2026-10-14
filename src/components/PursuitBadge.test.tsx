// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PursuitBadge } from "./PursuitBadge";
import { useUiPrefs } from "../state/uiPrefs";

const status = (level: "ruhig" | "spuerbar" | "nah" | "unmittelbar", distance = 3) => ({
  nearestIndex: 1,
  nearestNode: "b",
  distance,
  level,
});

describe("PursuitBadge", () => {
  it("renders the level text and nearest detective detail (never colour alone)", () => {
    useUiPrefs.setState({ language: "de" });
    render(<PursuitBadge status={status("nah", 2)} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("data-pursuit-level", "nah");
    expect(badge).toHaveTextContent("Nah");
    expect(badge).toHaveTextContent("D2");
    expect(badge).toHaveTextContent("2");
  });

  it("renders every level with its localized tier text", () => {
    useUiPrefs.setState({ language: "en" });
    for (const [level, text] of [
      ["ruhig", "Calm"],
      ["spuerbar", "Noticeable"],
      ["nah", "Close"],
      ["unmittelbar", "Imminent"],
    ] as const) {
      const { unmount } = render(<PursuitBadge status={status(level)} />);
      expect(screen.getByRole("status")).toHaveTextContent(text);
      unmount();
    }
  });
});
