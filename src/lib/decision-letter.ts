import type { Decision, DecisionResult } from "./ehds";
import { answerColumns, answerRows, isPercentage, metricLabel, formatValue } from "./answers";

const verdicts: Record<Decision, string> = {
  REJECT: "Request rejected",
  APPROVE_STATISTICAL: "Approved for statistical results",
  APPROVE_SPE: "Approved for access in a secure processing environment",
};

// Explicit projection: never pass the backend response or SPE records to the PDF builder.
export function createDecisionLetter(result: DecisionResult, date = new Date()) {
  const held = !!result.needs_review || result.status === "staff_review";
  const rows = result.decision === "APPROVE_STATISTICAL" ? answerRows(result.answer) : [];
  const columns = answerColumns(rows, true);
  const depth = Math.max(0, ...rows.map((row) => row.groups.length));
  const cohort = result.answer?.["cohort_size"] ?? result.population?.eligible_patients;
  return {
    issuer: "Health Data Access Body (HDAB)",
    reference: result.request_id,
    date: date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    decision: result.decision,
    verdict: held ? "Awaiting staff review — decision held" : verdicts[result.decision],
    rule: result.explanation?.rule || result.reason,
    triggers: [...(result.explanation?.trigger_phrases ?? [])],
    articles: (result.explanation?.articles ?? []).map((article) => ({
      number: article.number,
      ref:
        article.ref ||
        (article.number.startsWith("Art.") ? article.number : `Art. ${article.number}`),
      title: article.title,
      quote: article.quote,
      applies: article.applies ?? null,
      summary: article.summary,
    })),
    legalFallback: result.articles.length
      ? `${result.articles.join(", ")}. Verbatim legal quotes were not provided with this decision.`
      : "Legal basis was not provided with this decision.",
    plan:
      result.explanation?.plan_summary ||
      (result.decision === "REJECT"
        ? "No data counted or released."
        : "The counting plan was not provided with this decision."),
    table: rows.length
      ? {
          headers: [
            ...Array.from({ length: depth }, (_, i) => (depth === 1 ? "Group" : `Group ${i + 1}`)),
            ...columns.map(metricLabel),
          ],
          rows: rows.map((row) => [
            ...Array.from({ length: depth }, (_, i) => row.groups[i] ?? "—"),
            ...columns.map((column) =>
              formatValue(
                row.metrics[column],
                isPercentage(
                  column,
                  rows.map((r) => r.metrics[column]),
                ),
              ),
            ),
          ]),
        }
      : null,
    results:
      result.decision === "REJECT"
        ? "No data released."
        : result.decision === "APPROVE_SPE"
          ? `Cohort size: ${typeof cohort === "number" || typeof cohort === "string" ? cohort : "Not provided"}`
          : "No statistical results available.",
    conditions: [
      ...(held
        ? [
            "Awaiting staff review. No access or data release is authorised until review is complete.",
          ]
        : []),
      result.decision === "REJECT"
        ? "No data released. The prohibited-use restriction applies under Art. 54."
        : result.decision === "APPROVE_SPE"
          ? "Access only inside the secure processing environment; no download of patient-level data. Art. 73 applies."
          : "Use only for the stated purpose. Small cells are suppressed to protect privacy.",
    ],
  };
}

export type DecisionLetter = ReturnType<typeof createDecisionLetter>;
