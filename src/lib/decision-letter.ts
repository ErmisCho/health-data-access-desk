import type { Decision, DecisionResult, TimelineEvent } from "./ehds";
import { answerColumns, answerRows, isPercentage, metricLabel, formatValue } from "./answers";
import type { TranslationKey } from "./i18n";

type TFn = (key: TranslationKey) => string;

// Default (English) t() — used when createDecisionLetter is called without a translator
// (e.g. from tests or the PDF builder).
const EN_STRINGS: Partial<Record<TranslationKey, string>> = {
  "letter.verdict.REJECT": "Request rejected",
  "letter.verdict.APPROVE_STATISTICAL": "Approved for statistical results",
  "letter.verdict.APPROVE_SPE": "Approved for access in a secure processing environment",
  "letter.verdict.held": "Awaiting staff review — decision held",
  "letter.legalFallback.noQuotes":
    "Verbatim legal quotes were not provided with this decision.",
  "letter.legalFallback.none": "Legal basis was not provided with this decision.",
  "letter.plan.noData": "No data counted or released.",
  "letter.plan.notProvided": "The counting plan was not provided with this decision.",
  "letter.results.noData": "No data released.",
  "letter.results.cohort": "Cohort size:",
  "letter.results.noStats": "No statistical results available.",
  "letter.conditions.awaiting":
    "Awaiting staff review. No access or data release is authorised until review is complete.",
  "letter.conditions.reject":
    "No data released. The prohibited-use restriction applies under Art. 54.",
  "letter.conditions.spe":
    "Access only inside the secure processing environment; no download of patient-level data. Art. 73 applies.",
  "letter.conditions.stats":
    "Use only for the stated purpose. Small cells are suppressed to protect privacy.",
  "letter.issuer": "Health Data Access Body (HDAB)",
};

function makeDefaultT(): TFn {
  return (key) => EN_STRINGS[key] ?? key;
}

// Explicit projection: never pass the backend response or SPE records to the PDF builder.
export function createDecisionLetter(
  result: DecisionResult,
  date = new Date(),
  t: TFn = makeDefaultT(),
  locale = "en-GB",
) {
  const held = !!result.needs_review || result.status === "staff_review";
  const rows = result.decision === "APPROVE_STATISTICAL" ? answerRows(result.answer) : [];
  const columns = answerColumns(rows, true);
  const depth = Math.max(0, ...rows.map((row) => row.groups.length));
  const cohort = result.answer?.["cohort_size"] ?? result.population?.eligible_patients;

  const verdictKey = `letter.verdict.${result.decision}` as TranslationKey;
  const verdict = held ? t("letter.verdict.held") : t(verdictKey);

  const legalFallback = result.articles.length
    ? `${result.articles.join(", ")}. ${t("letter.legalFallback.noQuotes")}`
    : t("letter.legalFallback.none");

  const plan =
    result.explanation?.plan_summary ||
    (result.decision === "REJECT"
      ? t("letter.plan.noData")
      : t("letter.plan.notProvided"));

  const results =
    result.decision === "REJECT"
      ? t("letter.results.noData")
      : result.decision === "APPROVE_SPE"
        ? `${t("letter.results.cohort")} ${typeof cohort === "number" || typeof cohort === "string" ? cohort : "Not provided"}`
        : t("letter.results.noStats");

  const conditions = [
    ...(held ? [t("letter.conditions.awaiting")] : []),
    result.decision === "REJECT"
      ? t("letter.conditions.reject")
      : result.decision === "APPROVE_SPE"
        ? t("letter.conditions.spe")
        : t("letter.conditions.stats"),
  ];

  return {
    issuer: t("letter.issuer"),
    reference: result.request_id,
    date: date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
    decision: result.decision,
    verdict,
    timeline: result.timeline as TimelineEvent[] | undefined,
    needs_review: held,
    status: result.status,
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
    legalFallback,
    plan,
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
    results,
    conditions,
  };
}

export type DecisionLetter = ReturnType<typeof createDecisionLetter>;
