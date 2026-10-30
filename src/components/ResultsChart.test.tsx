import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { answerRows } from "@/lib/answers";
import { LangProvider } from "@/lib/i18n";
import { createDecisionLetter } from "@/lib/decision-letter";
import { ResultsChart } from "./ResultsChart";
import { ResultsTable } from "./ResultsTable";
import { DecisionLetter } from "./DecisionLetter";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const regional = {
  Burgenland: { count: "<10", mean_bmi: "suppressed" },
  Kärnten: { count: 30, mean_bmi: 24.1 },
  Niederösterreich: { count: 50, mean_bmi: 25.2 },
  Oberösterreich: { count: 40, mean_bmi: 26.3 },
  Salzburg: { count: 20, mean_bmi: 23.4 },
  Steiermark: { count: 60, mean_bmi: 27.5 },
  Tirol: { count: 15, mean_bmi: 25.6 },
  Vorarlberg: { count: 0, mean_bmi: 22.7 },
  Wien: { count: 80, mean_bmi: 28.8 },
};

it("uses the exact table values and prefers percentages; picker switches to counts", () => {
  render(
    <ResultsTable
      answer={{
        "18–49": { count: 30, prevalence_pct: 8.1 },
        "65+": { count: 0, prevalence_pct: 0 },
      }}
    />,
  );
  const table = screen.getByRole("table");
  expect(within(table).getByText("8.1 %")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "18–49: 8.1 %" })).toHaveTextContent("18–49: 8.1 %");
  fireEvent.change(screen.getByLabelText("Chart metric"), { target: { value: "count" } });
  expect(within(table).getByText("30")).toBeInTheDocument();
  const bar = screen.getByRole("img", { name: "18–49: 30" });
  expect(bar.querySelector('rect[fill="#075985"]')).toHaveAttribute("width", "100");
  const zero = screen.getByRole("img", { name: "65+: 0" });
  expect(zero.querySelector('rect[fill="#075985"]')).toHaveAttribute("width", "0");
});

it("hatches suppression without a numeric bar and never uses hidden values in scales", () => {
  render(
    <ResultsChart
      rows={answerRows({ A: { count: "<10" }, B: { count: "suppressed" }, C: { count: 4 } })}
    />,
  );
  for (const label of ["A: <10", "B: suppressed"]) {
    const bar = screen.getByRole("img", { name: label });
    expect(bar.querySelector('rect[fill^="url(#suppressed-"]')).toBeInTheDocument();
    expect(bar.querySelector('rect[fill="#075985"]')).toBeNull();
    expect(bar).not.toHaveTextContent(/NaN/);
  }
  expect(
    screen.getByRole("img", { name: "C: 4" }).querySelector('rect[fill="#075985"]'),
  ).toHaveAttribute("width", "100");
});

it("renders nine recognisable, named regions and colours only disclosed values", () => {
  const { container } = render(<ResultsTable answer={regional} />);
  const map = screen.getByRole("img", { name: /^Austria’s nine regions:/ });
  expect(map.querySelectorAll("[data-region]")).toHaveLength(9);
  for (const name of Object.keys(regional))
    expect(map.querySelector(`[data-region="${name}"]`)).toHaveAttribute("tabindex", "0");
  expect(map.querySelector('[data-region="Burgenland"] path')).toHaveAttribute(
    "fill",
    expect.stringContaining("url(#"),
  );
  expect(map.querySelector('[data-region="Wien"] path')).toHaveAttribute(
    "fill",
    "hsl(202 90% 18%)",
  );
  fireEvent.change(screen.getByLabelText("Chart metric"), { target: { value: "count" } });
  expect(within(map).getByRole("img", { name: "Burgenland: <10" })).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/NaN|Infinity/);
});

it("provides keyboard tooltips and dismisses them with Escape", () => {
  render(<ResultsChart rows={answerRows({ Hospital: { count: 42 } })} />);
  const bar = screen.getByRole("img", { name: "Hospital: 42" });
  fireEvent.focus(bar);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Hospital: 42");
  fireEvent.keyDown(bar, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("shows DE chart, map, scale, suppression and table fallback labels", () => {
  sessionStorage.setItem("ehds-lang", "de");
  render(
    <LangProvider>
      <ResultsTable answer={regional} />
    </LangProvider>,
  );
  expect(screen.getByLabelText("Kennzahl im Diagramm")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /^Österreichs neun Bundesländer:/ })).toBeInTheDocument();
  expect(screen.getByText(/Grau schraffiert: zurückgehalten/)).toBeInTheDocument();
  expect(screen.getByText(/Die genauen Werte und alle Kennzahlen/)).toBeInTheDocument();
  expect(screen.getByLabelText("Farbskala: niedrig bis hoch")).toBeInTheDocument();
});

it("does not map nonregional, partial or nested groups", () => {
  const { rerender } = render(
    <ResultsChart rows={answerRows({ Wien: { count: 2 }, Tirol: { count: 3 } })} />,
  );
  expect(screen.queryByRole("img", { name: /^Austria’s nine regions:/ })).not.toBeInTheDocument();
  rerender(<ResultsChart rows={answerRows({ "65+": regional })} />);
  expect(screen.queryByRole("img", { name: /^Austria’s nine regions:/ })).not.toBeInTheDocument();
});

it("handles all-suppressed regional answers without a numeric colour scale", () => {
  render(
    <ResultsChart
      rows={answerRows(
        Object.fromEntries(Object.keys(regional).map((name) => [name, { count: "suppressed" }])),
      )}
    />,
  );
  const map = screen.getByRole("img", { name: /^Austria’s nine regions:/ });
  expect(map.querySelectorAll('path[fill^="url(#"]')).toHaveLength(9);
  expect(screen.getByText("No disclosed numeric values for this metric.")).toBeInTheDocument();
});

it("includes charts on statistical decision letters alongside the unchanged table", () => {
  const letter = createDecisionLetter({
    request_id: "R01",
    decision: "APPROVE_STATISTICAL",
    articles: [],
    reason: "Allowed",
    answer: regional,
  });
  render(<DecisionLetter letter={letter} />);
  expect(screen.getByRole("img", { name: /^Austria’s nine regions:/ })).toBeInTheDocument();
  expect(within(screen.getByRole("table")).getByText("suppressed")).toBeInTheDocument();
});
