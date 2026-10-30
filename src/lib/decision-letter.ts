import type { AiMemo, Decision, DecisionResult, TimelineEvent, DecisionDeadline } from "./ehds";
import { answerColumns, answerRows, isPercentage, metricLabel, formatValue } from "./answers";
import type { TranslationKey } from "./i18n";

type TFn = (key: TranslationKey) => string;

// Default (English) t() — used when createDecisionLetter is called without a translator
// (e.g. from tests or the PDF builder).
const EN_STRINGS: Partial<Record<TranslationKey, string>> = {
  "letter.memo.heading": "AI-drafted reasoning memo (quotes verified)",
  "letter.memo.label": "AI-drafted",
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
  "decision.headline.APPROVE_STATISTICAL": "Yes — approved for anonymised statistics",
  "decision.headline.APPROVE_SPE": "Yes — approved for work in a secure processing environment",
  "decision.headline.REJECT": "No — this request cannot be approved",
  "decision.headline.held": "A person will review this request",
  "decision.next.APPROVE_STATISTICAL":
    "The anonymised results are shown below; groups smaller than 10 are hidden to protect privacy.",
  "decision.next.APPROVE_SPE":
    "You work with the data inside the secure environment; downloads are blocked and logged.",
  "decision.next.REJECT":
    "To request a reconsideration, choose a permitted purpose under Article 53 and submit a new request.",
  "decision.next.held":
    "Staff at the access body decide before the legal deadline{deadline}.",
};

function makeDefaultT(): TFn {
  return (key) => EN_STRINGS[key] ?? key;
}

// Plain-language headline and next step for an outcome; shared by the result view and the letter.
export function plainOutcome(result: DecisionResult, t: TFn, locale = "en-GB") {
  const held = !!result.needs_review || result.status === "staff_review";
  const outcome = held ? "held" : result.decision;
  const due = held && result.deadline?.due
    ? ` (${new Date(result.deadline.due).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })})`
    : "";
  return {
    headline: t(`decision.headline.${outcome}` as TranslationKey),
    nextSteps: t(`decision.next.${outcome}` as TranslationKey).replace("{deadline}", due),
  };
}

// Explicit projection: never pass the backend response or SPE records to the PDF builder.
export function createDecisionLetter(
  result: DecisionResult,
  date = new Date(),
  t: TFn = makeDefaultT(),
  locale = "en-GB",
) {
  const held = !!result.needs_review || result.status === "staff_review";

  const { headline, nextSteps } = plainOutcome(result, t, locale);

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
    headline,
    nextSteps,
    issuer: t("letter.issuer"),
    reference: result.request_id,
    date: date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
    decision: result.decision,
    verdict,
    timeline: result.timeline as TimelineEvent[] | undefined,
    deadline: result.deadline as DecisionDeadline | null | undefined,
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
    /** AI reasoning memo — present only when verified. Never sourced from answer/patient data. */
    memo: result.memo
      ? {
          text: result.memo.text,
          quotes: result.memo.quotes,
          model: result.memo.model,
          heading: t("letter.memo.heading"),
          label: t("letter.memo.label"),
        }
      : undefined,
    statisticalRows: rows,
    table: rows.length
      ? {
          headers: [
            ...Array.from({ length: depth }, (_, i) => (depth === 1 ? "Group" : `Group ${i + 1}`)),
            ...columns.map((column) => metricLabel(column, locale.startsWith("de") ? "de" : "en")),
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
