// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeatBadge } from "./HeatBadge";
import de from "../i18n/de.json";
import type { HeatLevel } from "../logic/InformationSystem";

const LEVELS: readonly HeatLevel[] = ["ruhig", "aktiv", "erhoeht", "kritisch"];
const LEVEL_TEXT: Record<HeatLevel, string> = {
  ruhig: de["heat.ruhig"],
  aktiv: de["heat.aktiv"],
  erhoeht: de["heat.erhoeht"],
  kritisch: de["heat.kritisch"],
};

describe("HeatBadge", () => {
  it.each(LEVELS)("shows level %s as icon plus text", (level) => {
    const { container } = render(<HeatBadge level={level} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("data-heat-level", level);
    expect(badge.textContent).toContain(LEVEL_TEXT[level]);
    expect(badge.textContent).toContain(de["heat.label"]);
    expect(container.querySelector("svg")).not.toBeNull();
    // Icon+text: the bar count encodes the level (1–4 lit bars).
    expect(container.querySelectorAll("[class*='barLit']")).toHaveLength(LEVELS.indexOf(level) + 1);
  });

  it("shows the score when provided", () => {
    render(<HeatBadge level="aktiv" score={2} />);
    expect(screen.getByRole("status").textContent).toContain("(2)");
  });
});
