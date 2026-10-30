import { en } from "./i18n/en";
import { de } from "./i18n/de";
import type { Lang } from "./i18n";
import type { Answer, AnswerValue } from "./ehds";

export interface AnswerRow {
  groups: string[];
  metrics: Record<string, AnswerValue>;
}
export function answerRows(answer: Answer | null): AnswerRow[] {
  if (!answer) return [];
  const rows: AnswerRow[] = [];
  function visit(node: Answer, groups: string[]) {
    const metrics: Record<string, AnswerValue> = {};
    const children: [string, Answer][] = [];
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "object" && value !== null) children.push([key, value]);
      else metrics[key] = value as AnswerValue;
    }
    if (Object.keys(metrics).length || (!children.length && groups.length))
      rows.push({ groups, metrics });
    for (const [key, child] of children) visit(child, [...groups, key]);
  }
  // Also tolerate the early API's region -> count shape.
  if (Object.values(answer).length && Object.values(answer).every((v) => typeof v !== "object")) {
    return Object.entries(answer).map(([group, value]) => ({
      groups: [group],
      metrics: { value: value as AnswerValue },
    }));
  }
  visit(answer, []);
  return rows;
}
export function isPercentage(metric: string, values: (AnswerValue | undefined)[] = []): boolean {
  return (
    /(?:_pct$|percent(?:age)?|%|^prevalence$)/i.test(metric) ||
    values.some((v) => typeof v === "string" && /%\s*$/.test(v))
  );
}
export function answerColumns(rows: AnswerRow[], showPercentages: boolean): string[] {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row.metrics)))];
  return columns.filter(
    (column) =>
      showPercentages ||
      !isPercentage(
        column,
        rows.map((r) => r.metrics[column]),
      ),
  );
}

export function metricLabel(key: string, lang: Lang = "en"): string {
  const dictionary = lang === "de" ? de : en;
  const labelKey = `results.metric.${key}`;
  if (Object.hasOwn(dictionary, labelKey))
    return dictionary[labelKey as keyof typeof dictionary];
  // Readable labels supplied as answer keys pass through; future raw keys get a fallback.
  return key.replace(/_pct$/, " (%)").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function formatValue(value: string | number | undefined, percentage = false): string {
  if (value === undefined) return "—";
  const text = String(value).trim();
  if (percentage || /%\s*$/.test(text)) {
    const numeric = text.replace(/\s*%$/, "");
    if (numeric !== "" && Number.isFinite(Number(numeric)))
      return `${Number(numeric).toFixed(1)} %`;
  }
  return String(value);
}
