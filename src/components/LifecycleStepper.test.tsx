import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LifecycleStepper } from "./LifecycleStepper";
import type { TimelineEvent } from "@/lib/ehds";

afterEach(cleanup);

const AT = "2026-10-30T12:00:00.000Z";

function timeline(...statuses: TimelineEvent["status"][]): TimelineEvent[] {
  return statuses.map((status) => ({ status, at: AT }));
}

describe("LifecycleStepper", () => {
  it("statistics path: shows Submitted→Assessed→Decided→Fulfilled, Fulfilled is Complete", () => {
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
    // Fulfilled is the terminal/last step — shows "Complete", not "Current".
    const fulfilled = items[items.length - 1];
    expect(fulfilled).toHaveAttribute("aria-current", "step");
    expect(fulfilled.querySelector(".text-muted-foreground")).toHaveTextContent("Complete");
    // All previous steps also show "Complete".
    items.slice(0, -1).forEach((li) =>
      expect(li.querySelector(".text-muted-foreground")).toHaveTextContent("Complete"),
    );
    // Timestamps are shown (formatted from AT).
    expect(screen.getAllByRole("time")).toHaveLength(4);
  });

  it("SPE path: Fulfilled shows Complete and timestamps", () => {
    render(
      <LifecycleStepper
        timeline={timeline("submitted", "assessed", "decided", "fulfilled")}
      />,
    );
    expect(screen.getByText("Fulfilled")).toBeInTheDocument();
    expect(screen.queryByText("Staff review")).not.toBeInTheDocument();
    expect(screen.getAllByRole("time")).toHaveLength(4);
    // Fulfilled is the terminal step → Complete.
    const items = screen.getAllByRole("listitem");
    expect(items[items.length - 1].querySelector(".text-muted-foreground")).toHaveTextContent("Complete");
  });

  it("reject path: shows Submitted→Assessed→Decided only; no Fulfilled; Decided is Complete", () => {
    render(
      <LifecycleStepper
        timeline={timeline("submitted", "assessed", "decided")}
      />,
    );
    const items = screen.getAllByRole("listitem");
    // Fulfilled is hidden for REJECT (decided is terminal with no fulfilled in timeline).
    expect(items).toHaveLength(3);
    const labels = items.map((li) => li.querySelector("span")?.textContent);
    expect(labels).toEqual(["Submitted", "Assessed", "Decided"]);
    expect(screen.queryByText("Fulfilled")).not.toBeInTheDocument();
    expect(screen.queryByText("Staff review")).not.toBeInTheDocument();
    // Decided is the terminal step → aria-current + Complete.
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[2].querySelector(".text-muted-foreground")).toHaveTextContent("Complete");
  });

  it("held path: Staff review is Current; Decided and Fulfilled are Pending", () => {
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
    // Staff review is not terminal — shows "Current".
    expect(staffReviewItem.querySelector(".text-muted-foreground")).toHaveTextContent("Current");
    // Decided and Fulfilled are pending.
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
    expect(screen.queryAllByRole("time")).toHaveLength(0);
    expect(screen.getByText("Fulfilled")).toBeInTheDocument();
  });

  it("falls back to current prop and needsReview when no timeline is provided", () => {
    render(<LifecycleStepper current="Staff review" needsReview />);
    const li = screen.getByText("Staff review").closest("li");
    expect(li).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Staff review")).toBeInTheDocument();
  });

  it("full lifecycle held→approved: all 5 steps visible, Fulfilled is Complete", () => {
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
    // Terminal step → Complete.
    expect(fulfilled.querySelector(".text-muted-foreground")).toHaveTextContent("Complete");
    expect(screen.getByText("Staff review")).toBeInTheDocument();
    // All earlier steps show "Complete".
    items.slice(0, -1).forEach((li) =>
      expect(li.querySelector(".text-muted-foreground")).toHaveTextContent("Complete"),
    );
  });
});
