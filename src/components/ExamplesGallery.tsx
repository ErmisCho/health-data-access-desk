import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SAMPLE_ENTRIES, submitRequest, type Decision, type DecisionResult } from "@/lib/ehds";
import { SiteHeader } from "./SiteHeader";
import { DecisionBadge } from "./DecisionBadge";
import { DecisionDetails } from "./DecisionDetails";
import { ErrorState } from "./States";
import { Button } from "./ui/button";

const expected: Record<string, { decision: Decision; reason: string }> = {
  R01: {
    decision: "APPROVE_STATISTICAL",
    reason: "Prevention planning receives anonymised regional statistics.",
  },
  R02: { decision: "REJECT", reason: "Insurance premium pricing is prohibited by Art. 54(1)(b)." },
  R03: {
    decision: "APPROVE_STATISTICAL",
    reason: "Healthcare quality planning receives anonymised statistics.",
  },
  R04: { decision: "REJECT", reason: "Advertising is prohibited by Art. 54(1)(c)." },
  R05: {
    decision: "APPROVE_SPE",
    reason: "Individual histories are justified for model training in a secure environment.",
  },
  R06: { decision: "REJECT", reason: "Employment decisions are prohibited by Art. 54(1)(b)." },
  R07: {
    decision: "APPROVE_STATISTICAL",
    reason: "Official health reporting receives anonymised statistics.",
  },
  R08: {
    decision: "APPROVE_STATISTICAL",
    reason: "Cancer prevention research receives statistics with small-cell suppression.",
  },
  R09: {
    decision: "APPROVE_STATISTICAL",
    reason: "Requested records are downgraded: no justification why statistics are insufficient.",
  },
  R10: {
    decision: "REJECT",
    reason: "Nicotine product development is prohibited by Art. 54(1)(d).",
  },
};

type Sample = (typeof SAMPLE_ENTRIES)[number];

export function ExamplesGallery() {
  const [selected, setSelected] = useState<Sample | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (selected) resultHeading.current?.focus();
  }, [selected]);

  async function open(sample: Sample) {
    setSelected(sample);
    setResult(null);
    setError("");
    setBusy(true);
    try {
      setResult(await submitRequest(sample.request));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The live result could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-landing text-foreground">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-semibold">Example requests</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Ten sample requests on synthetic data. Cards show expected decisions measured on 30
          October 2026. Open a card to submit the original request and inspect its full live result.
        </p>
        <Link
          to="/how-we-decide"
          className="mt-3 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          How we decide
        </Link>
        <ul aria-label="Sample requests" className="mt-6 grid gap-5 md:grid-cols-2">
          {SAMPLE_ENTRIES.map((sample) => (
            <li key={sample.id} className="min-w-0">
              <button
                type="button"
                onClick={() => open(sample)}
                disabled={busy}
                aria-label={`Open ${sample.label}`}
                aria-controls="example-result"
                aria-expanded={selected?.id === sample.id}
                className="flex h-full w-full flex-col items-start gap-4 rounded-lg border border-border bg-card p-5 text-left hover:border-primary disabled:opacity-60 sm:p-6"
              >
                <span className="font-mono text-sm text-accent">{sample.id}</span>
                <span className="text-lg font-semibold">{sample.request.question}</span>
                <span className="text-sm text-muted-foreground">
                  Applicant type: {sample.request.requested_as}
                </span>
                <span className="text-xs text-muted-foreground">Expected decision</span>
                <DecisionBadge decision={expected[sample.id]!.decision} />
                <span className="text-sm">{expected[sample.id]!.reason}</span>
                <span className="mt-auto pt-2 font-medium text-primary underline underline-offset-4">
                  Open full live result
                </span>
              </button>
            </li>
          ))}
        </ul>
        <section
          id="example-result"
          aria-labelledby="result-title"
          aria-busy={busy}
          className="mt-10 min-w-0 rounded-lg border border-border bg-card p-5 sm:p-8"
        >
          <h2
            id="result-title"
            ref={resultHeading}
            tabIndex={-1}
            className="font-display text-2xl font-semibold"
          >
            {selected ? `${selected.id} · Live result` : "Full live result"}
          </h2>
          <div aria-live="polite">
            {busy && (
              <p role="status" className="mt-4">
                Loading {selected?.id} from the live backend…
              </p>
            )}
            {error && <ErrorState>{error}</ErrorState>}
            {!selected && (
              <p className="mt-4 text-muted-foreground">
                Choose a sample request to inspect the decision, cited articles and available
                answer.
              </p>
            )}
          </div>
          {error && selected && (
            <Button onClick={() => open(selected)} variant="outline">
              Try again
            </Button>
          )}
          {result && selected && (
            <>
              <p className="mt-4">{selected.request.question}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Purpose: {selected.request.purpose}
              </p>
              <DecisionDetails key={result.request_id} result={result} request={selected.request} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
