// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventBanner } from "./EventBanner";

describe("EventBanner", () => {
  it("renders nothing without banners", () => {
    const { container } = render(<EventBanner banners={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders each banner with icon + text (never colour alone)", () => {
    render(
      <EventBanner
        banners={[
          { id: 1, text: "Weg gesperrt", tone: "info" },
          { id: 2, text: "Fahndung nah", tone: "alarm" },
        ]}
      />,
    );
    const stack = screen.getByTestId("event-banner-stack");
    expect(stack).toHaveTextContent("Weg gesperrt");
    expect(stack).toHaveTextContent("Fahndung nah");
    expect(stack.getAttribute("aria-live")).toBe("polite");
  });
});
