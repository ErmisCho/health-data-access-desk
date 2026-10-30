import { describe, expect, it } from "vitest";
import { answerColumns, answerRows, isPercentage, metricLabel } from "./answers";
describe("answer rendering helpers", () => {
  it("renders one dimension with zero, small cells and suppression intact", () => {
    expect(answerRows({ Wien: { adults: 0, cases: "<10", prevalence_pct: "suppressed" } })).toEqual(
      [{ groups: ["Wien"], metrics: { adults: 0, cases: "<10", prevalence_pct: "suppressed" } }],
    );
  });
  it("renders two dimensions without losing either group", () => {
    expect(
      answerRows({
        "65+": { Wien: { count: 42 }, Tirol: { count: "<10" } },
        "18-49": { Wien: { count: 0 } },
      }),
    ).toEqual([
      { groups: ["65+", "Wien"], metrics: { count: 42 } },
      { groups: ["65+", "Tirol"], metrics: { count: "<10" } },
      { groups: ["18-49", "Wien"], metrics: { count: 0 } },
    ]);
  });
  it("handles empty answers and retains empty groups", () => {
    expect(answerRows(null)).toEqual([]);
    expect(answerRows({})).toEqual([]);
    expect(answerRows({ Wien: {} })).toEqual([{ groups: ["Wien"], metrics: {} }]);
  });
  it("accepts early scalar counts", () => {
    expect(answerRows({ Wien: 0 })).toEqual([{ groups: ["Wien"], metrics: { value: 0 } }]);
  });
  it("detects percentage metrics from names or percent values", () => {
    for (const name of ["ace_pct", "percentage", "percent_treated", "share_%", "prevalence"])
      expect(isPercentage(name)).toBe(true);
    expect(isPercentage("share", ["10.1%", "suppressed"])).toBe(true);
    expect(isPercentage("count", [0, "<10", "suppressed"])).toBe(false);
    expect(isPercentage("mean_bmi", [26.5])).toBe(false);
  });
  it("hides only percentage columns and keeps the union of metrics", () => {
    const rows = answerRows({
      Wien: { count: 12, ace_pct: "suppressed" },
      Tirol: { count: 0, mean_bmi: 24 },
    });
    expect(answerColumns(rows, true)).toEqual(["count", "ace_pct", "mean_bmi"]);
    expect(answerColumns(rows, false)).toEqual(["count", "mean_bmi"]);
  });
});

it("prettifies generic and future metric names without changing their meaning", () => {
  expect(metricLabel("adults_with_hypertension")).toBe("Adults with hypertension");
  expect(metricLabel("cohort")).toBe("Cohort");
  expect(metricLabel("subset")).toBe("Subset");
  expect(metricLabel("percentage")).toBe("Percentage");
  expect(isPercentage("percentage", ["suppressed"])).toBe(true);
});

it("keeps readable backend labels and localizes known raw metric keys", () => {
  expect(metricLabel("Adults with type 2 diabetes")).toBe("Adults with type 2 diabetes");
  expect(metricLabel("type2_diabetes", "de")).toBe("Erwachsene mit Typ-2-Diabetes");
  expect(metricLabel("prevalence_pct", "de")).toBe("Prävalenz (%)");
  expect(metricLabel("future_metric_pct")).toBe("Future metric (%)");
});
