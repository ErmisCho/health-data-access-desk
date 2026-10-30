import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DecisionBadge } from "./DecisionBadge";
import { ResultsTable } from "./ResultsTable";
import { formatValue } from "./DataTable";
import { LifecycleStepper } from "./LifecycleStepper";
import { ExplanationPanel } from "./ExplanationPanel";
import { EmptyState, ErrorState } from "./States";

afterEach(cleanup);

describe("institutional design system", () => {
  it.each([
    ["REJECT", "Rejected", "destructive"],
    ["APPROVE_STATISTICAL", "Approved for statistics", "success"],
    ["APPROVE_SPE", "Approved for secure processing", "info"],
  ] as const)("uses semantic colours and a plain label for %s", (decision, label, token) => {
    render(<DecisionBadge decision={decision} />);
    // The outer badge span carries the colour classes and aria-label
    const badge = screen.getByLabelText(label);
    expect(badge).toHaveClass(`bg-${token}`, `text-${token}-foreground`);
    // The raw code is still present but only for secondary display (aria-hidden)
    const codeSpan = badge.querySelector(`[aria-hidden="true"]`);
    expect(codeSpan?.textContent).toContain(decision);
  });

  it.each(["<10", "suppressed"])("hatches %s and explains it on keyboard focus", async (value) => {
    render(<ResultsTable answer={{ Wien: { count: value } }} />);
    const trigger = screen.getByRole("button", { name: value });
    expect(trigger.closest("td")).toHaveClass("suppressed-cell");
    fireEvent.focus(trigger);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Value withheld to protect privacy",
    );
    expect(trigger).toHaveAttribute("aria-describedby");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("formats numeric and string percentages with one decimal without changing counts or suppression", () => {
    render(<ResultsTable answer={{ Wien: { count: 8, prevalence_pct: 8, share: "8%" } }} />);
    expect(screen.getAllByText("8.0 %")).toHaveLength(2);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(formatValue("8.25%", true)).toBe("8.3 %");
    expect(formatValue(0, true)).toBe("0.0 %");
    expect(formatValue("suppressed", true)).toBe("suppressed");
    expect(formatValue("<10", true)).toBe("<10");
  });

  it("marks the current step, preserves supplied timestamps, and leaves fulfilment pending", () => {
    render(
      <LifecycleStepper
        current="Staff review"
        needsReview
        timestamps={{ Submitted: "2026-10-29T18:30:00Z" }}
      />,
    );
    expect(screen.getByText("Staff review").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Fulfilled").closest("li")).toHaveTextContent("Pending");
    expect(screen.getByText("2026-10-29T18:30:00Z")).toHaveAttribute(
      "datetime",
      "2026-10-29T18:30:00Z",
    );
  });

  it("renders the rule, trigger phrase, plan and verbatim legal quote", () => {
    render(
      <ExplanationPanel
        explanation={{
          rule: "Prohibited purpose",
          trigger_phrases: ["advertising"],
          plan_summary: "A marketing analysis",
          articles: [
            {
              number: "54",
              title: "Prohibited uses",
              summary: "Restrictions apply.",
              quote: "Verbatim legal text.",
              ref: "EHDS Art. 54",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Prohibited purpose")).toBeInTheDocument();
    expect(screen.getByText("advertising").tagName).toBe("Q");
    expect(screen.getByText("A marketing analysis")).toBeInTheDocument();
    expect(screen.getByText("Verbatim legal text.").tagName).toBe("BLOCKQUOTE");
    expect(screen.getByText("EHDS Art. 54")).toBeInTheDocument();
  });

  it("offers consistent empty and announced error states", () => {
    render(
      <>
        <EmptyState title="No requests">Submit a request to begin.</EmptyState>
        <ErrorState>Could not load requests.</ErrorState>
      </>,
    );
    expect(screen.getByText("No requests")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load requests.");
  });
});
