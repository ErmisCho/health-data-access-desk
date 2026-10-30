import { useState } from "react";
import { downloadRequest, SAMPLE_ENTRIES, submitRequest, type DecisionResult } from "@/lib/ehds";
import { answerRows } from "@/lib/answers";
import { DecisionDetails } from "./DecisionDetails";
import { EmptyState, ErrorState } from "./States";
import { useLang, useT, type Lang } from "@/lib/i18n";
import { localizeBackendText } from "@/lib/i18n/translations";

const scenarios = [
  { key: "purpose", id: "R02", labelKey: "demo.scenario.purpose" },
  { key: "statistics", id: "R01", labelKey: "demo.scenario.statistics" },
  { key: "opt-outs", id: "R01", labelKey: "demo.scenario.optOuts" },
  { key: "small-cells", id: "R08", labelKey: "demo.scenario.smallCells" },
  { key: "spe", id: "R05", labelKey: "demo.scenario.spe" },
  { key: "download", id: "R05", labelKey: "demo.scenario.download" },
  { key: "downgrade", id: "R09", labelKey: "demo.scenario.downgrade" },
] as const;
type ScenarioKey = (typeof scenarios)[number]["key"];
type Scenario =
  | { key: ScenarioKey; id: string; label: string }
  | { key: "request"; id: string; label: string };
type Download = Awaited<ReturnType<typeof downloadRequest>>;
interface Outcome {
  scenario: Scenario;
  result: DecisionResult;
  download?: Download;
}

function pointAt(
  { scenario, result, download }: Outcome,
  lang: Lang,
): string {
  const metric = (group: string, key: string) =>
    answerRows(result.answer).find((row) => row.groups.includes(group))?.metrics[key] ??
    "Not provided";
  switch (scenario.key) {
    case "request":
      return localizeBackendText(result.reason, lang);
    case "purpose":
      return `Numerical answer: ${result.answer === null ? "null (no numerical answer)" : "an answer was returned — inspect the result"}.`;
    case "statistics":
      return `Wien: ${metric("Wien", "type2_diabetes")} adults with type 2 diabetes / ${metric("Wien", "adults")} adults; prevalence (%): ${metric("Wien", "prevalence_pct")}.`;
    case "opt-outs":
      return `Eligible patients: ${result.population?.eligible_patients ?? "Not provided by the backend"}. Wien adult denominator: ${metric("Wien", "adults")}.`;
    case "small-cells":
      return `Burgenland: women with BMI = ${metric("Burgenland", "women_with_bmi")}; mean BMI = ${metric("Burgenland", "mean_bmi")}. Niederösterreich: women with BMI = ${metric("Niederösterreich", "women_with_bmi")}; mean BMI = ${metric("Niederösterreich", "mean_bmi")}.`;
    case "spe": {
      const cohort = result.answer?.["cohort_size"];
      return `Cohort size: ${typeof cohort === "number" || typeof cohort === "string" ? cohort : "Not provided"}. Secure environment: ${result.spe_schema ?? "Not provided"}.`;
    }
    case "download":
      return download
        ? `HTTP ${download.status} · ${localizeBackendText(download.message, lang)}`
        : "Download refusal not confirmed. See the error and decision below.";
    case "downgrade":
      return `Requested pseudonymised records → returned ${result.decision}. Ages 18–49: ${metric("18-49", "adults_with_hypertension")} adults with hypertension; ACE inhibitor (%): ${metric("18-49", "ace_inhibitor_pct")}; ARB (%): ${metric("18-49", "arb_pct")}.`;
  }
}

export function DemoPanel() {
  const t = useT();
  const { lang } = useLang();
  const [sampleId, setSampleId] = useState(SAMPLE_ENTRIES[0]!.id);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [running, setRunning] = useState<Scenario | null>(null);
  const [error, setError] = useState("");

  async function run(scenario: Scenario) {
    setRunning(scenario);
    setOutcome(null);
    setError("");
    try {
      const fixture = SAMPLE_ENTRIES.find((entry) => entry.id === scenario.id);
      if (!fixture) throw new Error(`Request fixture ${scenario.id} is unavailable.`);
      const result = await submitRequest(fixture.request);
      const next: Outcome = { scenario, result };
      setOutcome(next);
      if (scenario.key === "download") {
        if (result.decision !== "APPROVE_SPE" || result.needs_review)
          throw new Error(
            "R05 did not receive a secure-environment approval. Download was not attempted.",
          );
        const download = await downloadRequest(fixture.id);
        setOutcome({ ...next, download });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scenario failed. Please try again.");
    } finally {
      setRunning(null);
    }
  }

  const request =
    outcome && SAMPLE_ENTRIES.find((entry) => entry.id === outcome.scenario.id)?.request;
  return (
    <div className="space-y-6">
      <h1 className="sr-only">{t("desk.heading")}</h1>
      <section aria-label={t("demo.proof.heading")} className="rounded border border-border bg-muted p-4">
        <h2 className="font-display text-lg font-semibold">{t("demo.proof.heading")}</h2>
        <p className="mt-2 font-mono text-sm">{t("demo.proof.text")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("demo.proof.disclaimer")}</p>
      </section>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section>
          <h2 className="font-display text-2xl font-semibold">{t("demo.heading")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("demo.intro")}</p>
          <ol className="mt-4 space-y-2">
            {scenarios.map((scenario, index) => {
              const label = t(scenario.labelKey as Parameters<typeof t>[0]);
              return (
                <li key={scenario.key}>
                  <button
                    onClick={() => run({ key: scenario.key, id: scenario.id, label })}
                    disabled={running !== null}
                    aria-pressed={outcome?.scenario.key === scenario.key}
                    className="w-full rounded border border-input bg-card px-4 py-3 text-left text-sm font-medium hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted disabled:opacity-50"
                  >
                    {index + 1}. {label} · {scenario.id}
                  </button>
                </li>
              );
            })}
          </ol>
          <label className="mt-6 block text-sm font-medium">
            {t("demo.anyRequest")}
            <select
              value={sampleId}
              onChange={(event) => setSampleId(event.target.value)}
              disabled={running !== null}
              className="mt-2 block w-full min-w-0 rounded border border-input bg-card px-3 py-2 text-foreground"
            >
              {SAMPLE_ENTRIES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={running !== null}
            onClick={() =>
              run({ key: "request", id: sampleId, label: t("demo.run") })
            }
            className="mt-3 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {t("demo.run")}
          </button>
        </section>
        <section
          aria-label="Live demo result"
          aria-live="polite"
          aria-busy={running !== null}
          className="min-w-0 rounded border border-border bg-card p-6"
        >
          <h2 className="font-display text-2xl font-semibold">
            {outcome
              ? `${outcome.scenario.id} · ${outcome.scenario.label}`
              : t("demo.result.heading")}
          </h2>
          {running && (
            <p role="status" className="mt-4">
              {t("demo.running")} {running.id} {t("demo.onBackend")}
            </p>
          )}
          {error && <ErrorState>{error}</ErrorState>}
          {outcome && !running && (
            <>
              <aside
                aria-label={t("demo.pointAt.heading")}
                className="mt-4 rounded border-2 border-primary bg-muted p-4"
              >
                <h3 className="font-semibold">{t("demo.pointAt.heading")}</h3>
                <p className="mt-2 break-words font-mono text-sm">
                  {pointAt(outcome, lang)}
                </p>
                {outcome.scenario.key === "opt-outs" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("demo.optouts.note")}
                  </p>
                )}
              </aside>
              {request && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("demo.requested")} {request.requested_as} · {request.requested_format}
                </p>
              )}
              <DecisionDetails
                key={JSON.stringify(outcome)}
                result={outcome.result}
                request={request || undefined}
              />
            </>
          )}
          {!outcome && !running && !error && (
            <EmptyState title={t("demo.empty")} />
          )}
        </section>
      </div>
      <p className="text-xs text-muted-foreground">{t("demo.disclaimer")}</p>
    </div>
  );
}
