import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SAMPLE_ENTRIES, submitRequest, type DecisionResult } from "@/lib/ehds";
import { StaffHistory } from "@/components/StaffHistory";
import { DecisionDetails } from "@/components/DecisionDetails";
import { DemoPanel } from "@/components/DemoPanel";

import { EmptyState, ErrorState } from "@/components/States";

export const Route = createFileRoute("/desk")({
  validateSearch: (search: Record<string, unknown>): { view?: "demo" | undefined } => ({
    view: search["view"] === "demo" ? "demo" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "EHDS Access Desk — Health Data Access Body" },
      {
        name: "description",
        content:
          "Submit EHDS secondary-use data requests and review decisions, cited articles and secure-environment status.",
      },
    ],
  }),
  component: Desk,
});

function Desk() {
  const { view } = Route.useSearch();
  const [role, setRole] = useState<"applicant" | "staff" | "demo">(view ?? "applicant");
  useEffect(() => setRole(view ?? "applicant"), [view]);
  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest">
              Health Data Access Body · EHDS
            </p>
            <h1 className="font-display text-3xl font-bold">EHDS Access Desk</h1>
          </div>
          <div
            className="flex rounded border border-primary-foreground/30 p-1"
            aria-label="View role"
          >
            {(["applicant", "staff", "demo"] as const).map((r) => (
              <button
                key={r}
                aria-pressed={role === r}
                onClick={() => setRole(r)}
                className={`rounded px-4 py-1.5 text-sm font-medium capitalize ${role === r ? "bg-accent text-accent-foreground" : "hover:bg-primary-foreground/10"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div hidden={role !== "applicant"}>
          <Applicant />
        </div>
        {role === "staff" && <StaffHistory />}
        {role === "demo" && <DemoPanel />}
      </main>
    </div>
  );
}

function Applicant() {
  const [text, setText] = useState(JSON.stringify(SAMPLE_ENTRIES[0]!.request, null, 2));
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setError("");
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    setBusy(true);
    try {
      setResult(await submitRequest(parsed));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="min-w-0">
        <h2 className="font-display text-2xl font-semibold">Data access request</h2>
        <label className="mt-4 block text-sm text-muted-foreground">
          Sample request
          <select
            disabled={busy}
            className="mt-1 block w-full rounded border border-input bg-card px-3 py-2 text-foreground"
            onChange={(e) => {
              setText(JSON.stringify(SAMPLE_ENTRIES[+e.target.value]!.request, null, 2));
              setResult(null);
              setError("");
            }}
          >
            {SAMPLE_ENTRIES.map((s, i) => (
              <option key={s.id} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <textarea
          aria-label="Request JSON"
          disabled={busy}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          className="mt-4 h-80 w-full rounded border border-input bg-card p-3 font-mono text-sm"
        />
        {error && <ErrorState>{error}</ErrorState>}
        <button
          onClick={submit}
          disabled={busy}
          className="mt-4 rounded bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Evaluating…" : "Submit request"}
        </button>
      </section>
      <section aria-live="polite" className="min-w-0 rounded border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-semibold">Decision</h2>
        {result ? (
          <DecisionDetails key={JSON.stringify(result)} result={result} />
        ) : (
          <EmptyState
            title={busy ? "Evaluating request…" : "Submit a request to see the HDAB decision."}
          />
        )}
      </section>
    </div>
  );
}
