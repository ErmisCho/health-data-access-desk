import { useEffect, useState } from "react";
import { listRegister, type RegisterEntry, type Decision } from "@/lib/ehds";
import { DecisionBadge } from "./DecisionBadge";
import { SiteHeader } from "./SiteHeader";

export function TransparencyRegister() {
  const [entries, setEntries] = useState<RegisterEntry[]>([]);
  const [filter, setFilter] = useState<Decision | "">("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    listRegister().then(
      ({ entries }) => {
        if (active) {
          setEntries(entries);
          setStatus("ready");
        }
      },
      () => {
        if (active) setStatus("error");
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const visible = entries.filter((entry) => !filter || entry.decision === filter);
  return (
    <div className="min-h-screen bg-landing text-foreground">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Transparency register</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          This public register lists up to 200 of the latest decided requests, newest first. We
          publish a reference, submission date, organisation type, purpose category, decision and
          relevant EHDS articles. Requests awaiting review are excluded.
        </p>
        <p className="max-w-3xl text-muted-foreground">
          We deliberately omit personal and organisation names, original request identifiers,
          free-text purposes and questions, and all patient data, answers and cohort sizes.
          References identify register entries only; categories use standard labels.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="decision-filter" className="font-medium">
            Filter by decision
          </label>
          <select
            id="decision-filter"
            className="min-h-11 max-w-full rounded border border-input bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Decision | "")}
          >
            <option value="">All decisions</option>
            <option value="REJECT">Rejected</option>
            <option value="APPROVE_STATISTICAL">Approved for statistics</option>
            <option value="APPROVE_SPE">Approved for secure processing</option>
          </select>
        </div>
        {status === "loading" && <p role="status">Loading decisions…</p>}
        {status === "error" && (
          <div role="alert" className="space-y-3">
            <p>The register could not be loaded. Please try again.</p>
            <button
              className="min-h-11 rounded border border-input bg-background px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}
        {status === "ready" && (
          <>
            <p role="status">
              {visible.length} {visible.length === 1 ? "decision" : "decisions"} shown
            </p>
            {visible.length === 0 ? (
              <p>
                {entries.length === 0
                  ? "No decided requests have been published yet."
                  : "No decisions match this filter."}
              </p>
            ) : (
              <div
                role="region"
                aria-label="Published decisions"
                tabIndex={0}
                className="overflow-x-auto rounded border border-border focus-visible:outline-2 focus-visible:outline-ring"
              >
                <table className="w-full min-w-[760px] text-left text-sm">
                  <caption className="sr-only">Public decisions, newest submission first</caption>
                  <thead className="bg-muted">
                    <tr>
                      {[
                        "Reference",
                        "Submission date",
                        "Organisation type",
                        "Purpose category",
                        "Decision",
                        "Articles",
                      ].map((heading) => (
                        <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {visible.map((entry) => (
                      <tr key={entry.reference} className="border-t border-border">
                        <th scope="row" className="px-4 py-4 font-mono font-medium">
                          {entry.reference}
                        </th>
                        <td className="whitespace-nowrap px-4 py-4">
                          <time dateTime={entry.date}>{entry.date}</time>
                        </td>
                        <td className="px-4 py-4">{entry.organisation_type}</td>
                        <td className="px-4 py-4">{entry.purpose_category}</td>
                        <td className="px-4 py-4">
                          <DecisionBadge decision={entry.decision} />
                        </td>
                        <td className="px-4 py-4">
                          {entry.articles.map((article) => `Art. ${article}`).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
