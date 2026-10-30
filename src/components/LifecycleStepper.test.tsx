import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LifecycleStepper } from "./LifecycleStepper";
import type { TimelineEvent } from "@/lib/ehds";

afterEach(cleanup);

const AT = "2026-10-30T12:00:00Z";

function timeline(...statuses: TimelineEvent["status"][]): TimelineEvent[] {
  return statuses.map((status) => ({ status, at: AT }));
}

describe("LifecycleStepper", () => {
  it("statistics path: shows Submitted→Assessed→Decided→Fulfilled, Fulfilled is current", () => {
    render(
      <LifecycleStepper
        timeline={timeline("submitted", "assessed", "decided", "fulfilled")}
      />,
    );
    const items = screen.getAllByRole("listitem");
    const labels = items.map((li) => li.querySelector("span")?.textContent);
    expect(labels).toEqual(["Submitted", "Assessed", "Decided", "Fulfilled"]);
    // Staff review step is hidden for non-held requests.
    expect(screen.queryByText("Staff review")).not.toBeInTheDocument();
    // Fulfilled is highlighted as current.
    const fulfilled = items[items.length - 1];
    expect(fulfilled).toHaveAttribute("aria-current", "step");
    expect(fulfilled.querySelector("span")).toHaveClass("font-semibold");
    // All previous steps show "Complete".
    items.slice(0, -1).forEach((li) =>
      expect(li.querySelector(".text-muted-foreground")).toHaveTextContent("Complete"),
    );
    // Timestamps are shown (formatted from AT).
    expect(screen.getAllByRole("time")).toHaveLength(4);
  });

  it("SPE path: shows Submitted→Assessed→Decided→Fulfilled with timestamps", () => {
    render(
      <LifecycleStepper
        timeline={timeline("submitted", "assessed", "decided", "fulfilled")}
      />,
    );
    // Same shape as statistics — fulfilled is last.
    expect(screen.getByText("Fulfilled")).toBeInTheDocument();
    expect(screen.queryByText("Staff review")).not.toBeInTheDocument();
    expect(screen.getAllByRole("time")).toHaveLength(4);
  });

  it("reject path: shows Submitted→Assessed→Decided→Fulfilled (Fulfilled pending, Decided current)", () => {
    render(
      <LifecycleStepper
        timeline={timeline("submitted", "assessed", "decided")}
      />,
    );
    const items = screen.getAllByRole("listitem");
    // Staff review is hidden (no hold), but Fulfilled is shown as pending.
    expect(items).toHaveLength(4);
    const labels = items.map((li) => li.querySelector("span")?.textContent);
    expect(labels).toEqual(["Submitted", "Assessed", "Decided", "Fulfilled"]);
    expect(screen.queryByText("Staff review")).not.toBeInTheDocument();
    // Decided is the last recorded step → current.
    const decidedItem = items.find((li) => li.querySelector("span")?.textContent === "Decided")!;
    expect(decidedItem).toHaveAttribute("aria-current", "step");
    // Fulfilled is pending.
    const fulfilledItem = items.find((li) => li.querySelector("span")?.textContent === "Fulfilled")!;
    expect(fulfilledItem.querySelector(".text-muted-foreground")).toHaveTextContent("Pending");
  });

  it("held path: shows Submitted→Assessed→Staff review as current (Decided/Fulfilled pending)", () => {
    render(
      <LifecycleStepper
        timeline={timeline("submitted", "assessed", "staff_review")}
      />,
    );
    const items = screen.getAllByRole("listitem");
    const labels = items.map((li) => li.querySelector("span")?.textContent);
    expect(labels).toContain("Staff review");
    const staffReviewItem = items.find(
      (li) => li.querySelector("span")?.textContent === "Staff review",
    )!;
    expect(staffReviewItem).toHaveAttribute("aria-current", "step");
    // Decided and Fulfilled are pending (not in timeline), so they show "Pending".
    const decidedItem = items.find((li) => li.querySelector("span")?.textContent === "Decided");
    expect(decidedItem?.querySelector(".text-muted-foreground")).toHaveTextContent("Pending");
    const fulfilledItem = items.find((li) => li.querySelector("span")?.textContent === "Fulfilled");
    expect(fulfilledItem?.querySelector(".text-muted-foreground")).toHaveTextContent("Pending");
  });

  it("timestamps show formatted local time from the at field", () => {
    render(
      <LifecycleStepper
        timeline={[
          { status: "submitted", at: "2026-10-30T10:00:00Z" },
          { status: "assessed", at: "2026-10-30T10:00:05Z" },
          { status: "decided", at: "2026-10-30T10:00:10Z" },
        ]}
      />,
    );
    const times = screen.getAllByRole("time");
    expect(times).toHaveLength(3);
    // Each time element has a dateTime attribute.
    times.forEach((t) => expect(t).toHaveAttribute("dateTime"));
  });

  it("empty at strings are not shown as timestamps", () => {
    render(
      <LifecycleStepper
        timeline={[
          { status: "submitted", at: "" },
          { status: "assessed", at: "" },
          { status: "decided", at: "" },
          { status: "fulfilled", at: "" },
        ]}
      />,
    );
    // No <time> elements when all at values are empty.
    expect(screen.queryAllByRole("time")).toHaveLength(0);
    // Steps are still rendered.
    expect(screen.getByText("Fulfilled")).toBeInTheDocument();
  });

  it("falls back to current prop and needsReview when no timeline is provided", () => {
    render(<LifecycleStepper current="Staff review" needsReview />);
    const li = screen.getByText("Staff review").closest("li");
    expect(li).toHaveAttribute("aria-current", "step");
    // Staff review should be visible (needsReview=true).
    expect(screen.getByText("Staff review")).toBeInTheDocument();
  });

  it("full lifecycle held→approved: all 5 steps visible, fulfilled is current", () => {
    render(
      <LifecycleStepper
        timeline={timeline(
          "submitted",
          "assessed",
          "staff_review",
          "decided",
          "fulfilled",
        )}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const fulfilled = items[items.length - 1];
    expect(fulfilled).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Staff review")).toBeInTheDocument();
    // Staff review and all earlier steps are "Complete".
    ["Submitted", "Assessed", "Staff review", "Decided"].forEach((label) => {
      const li = items.find((item) => item.querySelector("span")?.textContent === label)!;
      expect(li?.querySelector(".text-muted-foreground")).toHaveTextContent("Complete");
    });
  });
});
