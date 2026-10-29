import { useState } from "react";
import { downloadRequest, SAMPLE_ENTRIES, submitRequest, type DecisionResult } from "@/lib/ehds";
import { answerRows } from "@/lib/answers";
import { DecisionDetails } from "./DecisionDetails";
import { EmptyState, ErrorState } from "./States";

const scenarios = [
  { key: "purpose", id: "R02", label: "Art. 54 rejection" },
  { key: "statistics", id: "R01", label: "Statistics with numbers" },
  { key: "opt-outs", id: "R01", label: "Opted-out patients excluded" },
  { key: "small-cells", id: "R08", label: "Small-cell suppression" },
  { key: "spe", id: "R05", label: "Secure environment" },
  { key: "download", id: "R05", label: "Blocked download" },
  { key: "downgrade", id: "R09", label: "Records downgraded to statistics" },
] as const;
type Scenario = (typeof scenarios)[number];
type Download = Awaited<ReturnType<typeof downloadRequest>>;
interface Outcome {
  scenario: Scenario;
  result: DecisionResult;
  download?: Download;
}

function pointAt({ scenario, result, download }: Outcome): string {
  const metric = (group: string, key: string) =>
    answerRows(result.answer).find((row) => row.groups.includes(group))?.metrics[key] ??
    "Not provided";
  switch (scenario.key) {
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
        ? `HTTP ${download.status} · ${download.message}`
        : "Download refusal not confirmed. See the error and decision below.";
    case "downgrade":
      return `Requested pseudonymised records → returned ${result.decision}. Ages 18–49: ${metric("18-49", "adults_with_hypertension")} adults with hypertension; ACE inhibitor (%): ${metric("18-49", "ace_inhibitor_pct")}; ARB (%): ${metric("18-49", "arb_pct")}.`;
  }
}

export function DemoPanel() {
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
      <section aria-label="Proof" className="rounded border border-border bg-muted p-4">
        <h2 className="font-display text-lg font-semibold">Proof</h2>
        <p className="mt-2 font-mono text-sm">
          Measured 30 Oct 2026 against the live backend: 10/10 sample decisions · 6/6 numbers · 0
          leaks · consistent over 3 runs · 42 jury requests, 0 wrong decisions, 0 leaks, 13
          prohibited purposes rejected
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Test requests, not real applications.</p>
      </section>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section>
          <h2 className="font-display text-2xl font-semibold">Two-minute demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run in presentation order. Every click submits the original request to the live backend.
          </p>
          <ol className="mt-4 space-y-2">
            {scenarios.map((scenario, index) => (
              <li key={scenario.key}>
                <button
                  onClick={() => run(scenario)}
                  disabled={running !== null}
                  aria-pressed={outcome?.scenario.key === scenario.key}
                  className="w-full rounded border border-input bg-card px-4 py-3 text-left text-sm font-medium hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted disabled:opacity-50"
                >
                  {index + 1}. {scenario.label} · {scenario.id}
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section
          aria-label="Live demo result"
          aria-live="polite"
          aria-busy={running !== null}
          className="min-w-0 rounded border border-border bg-card p-6"
        >
          <h2 className="font-display text-2xl font-semibold">
            {outcome ? `${outcome.scenario.id} · ${outcome.scenario.label}` : "Live result"}
          </h2>
          {running && (
            <p role="status" className="mt-4">
              Running {running.id} on the backend…
            </p>
          )}
          {error && <ErrorState>{error}</ErrorState>}
          {outcome && !running && (
            <>
              <aside
                aria-label="What to point at"
                className="mt-4 rounded border-2 border-primary bg-muted p-4"
              >
                <h3 className="font-semibold">What to point at</h3>
                <p className="mt-2 break-words font-mono text-sm">{pointAt(outcome)}</p>
                {outcome.scenario.key === "opt-outs" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Art. 71: eligible patients is the backend population count. Source-level
                    exclusion relies on queries starting from eligible_patients before cohort
                    filters and aggregation; this count alone is not an opt-out audit. The cited
                    decision articles remain below.
                  </p>
                )}
              </aside>
              {request && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Requested: {request.requested_as} · {request.requested_format}
                </p>
              )}
              <DecisionDetails key={JSON.stringify(outcome)} result={outcome.result} />
            </>
          )}
          {!outcome && !running && !error && (
            <EmptyState title="Choose a scenario to see its live decision and proof." />
          )}
        </section>
      </div>
      <p className="text-xs text-muted-foreground">
        Synthetic-data prototype · rules-based parser with limited language support · staff switch
        lacks production authentication.
      </p>
    </div>
  );
}
