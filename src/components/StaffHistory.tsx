import { useEffect, useState } from "react";
import { getRequest, listRequests, type DecisionResult, type RequestHistory } from "@/lib/ehds";
import { DecisionDetails } from "./DecisionDetails";

export function StaffHistory() {
  const [history, setHistory] = useState<RequestHistory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listRequests()
      .then((data) => {
        if (!active) return;
        setHistory(data);
        setSelectedId((id) =>
          id && data.requests.some((r) => r.request_id === id)
            ? id
            : (data.requests[0]?.request_id ?? null),
        );
      })
      .catch((error) => {
        if (active) setError(error instanceof Error ? error.message : "Could not load history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    setDetailError("");
    if (selectedId)
      getRequest(selectedId)
        .then((data) => {
          if (active) setResult(data);
        })
        .catch((error) => {
          if (active)
            setDetailError(error instanceof Error ? error.message : "Could not load saved result.");
        });
    return () => {
      active = false;
    };
  }, [selectedId, history]);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">Past requests</h2>
        <button
          disabled={loading}
          onClick={() => setRefresh((n) => n + 1)}
          className="rounded border border-input px-3 py-1 text-sm disabled:opacity-50"
        >
          Refresh history
        </button>
      </div>
      {loading && (
        <p role="status" className="mt-4">
          Loading history…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          Could not load history: {error}
        </p>
      )}
      {history && (
        <>
          <div className="mt-4 overflow-x-auto rounded border border-border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Submission history</caption>
              <thead>
                <tr>
                  <th className="p-3">Request</th>
                  <th className="p-3">Saved at</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Review</th>
                  <th className="p-3">Secure environment</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.requests.map((row, i) => (
                  <tr
                    key={`${row.request_id}-${row.submitted_at}-${i}`}
                    className="border-t border-border"
                  >
                    <th scope="row" className="p-3">
                      {row.request_id}
                    </th>
                    <td className="p-3">{row.submitted_at}</td>
                    <td className="p-3">{row.decision}</td>
                    <td className="p-3">
                      {row.needs_review ? "Needs staff review" : "No review needed"}
                    </td>
                    <td className="p-3">
                      {row.spe_schema
                        ? `${row.spe_schema} · downloads blocked`
                        : "No secure environment recorded"}
                    </td>
                    <td className="p-3">
                      <button
                        aria-pressed={selectedId === row.request_id}
                        onClick={() => setSelectedId(row.request_id)}
                        className="rounded border border-input px-3 py-1"
                      >
                        View latest result for {row.request_id}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!history.requests.length && <p className="mt-4">No saved requests.</p>}
          {selectedId && (
            <article className="mt-6 rounded border border-border bg-card p-6">
              <h3 className="font-semibold">Latest saved result — {selectedId}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                For repeated request IDs, this shows the most recent saved response.
              </p>
              {detailError ? (
                <p role="alert" className="mt-4 text-destructive">
                  Could not load saved result: {detailError}
                </p>
              ) : result && result.request_id === selectedId ? (
                <DecisionDetails
                  key={selectedId}
                  result={result}
                  staff
                  onDownloadAttempt={() => setRefresh((n) => n + 1)}
                />
              ) : (
                <p role="status" className="mt-4">
                  Loading saved result…
                </p>
              )}
            </article>
          )}
          <h3 className="mt-8 font-display text-xl font-semibold">Blocked-download log</h3>
          {history.downloads.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Blocked download attempts</caption>
                <thead>
                  <tr>
                    <th className="p-3">Request</th>
                    <th className="p-3">Attempted at</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.downloads.map((attempt, i) => (
                    <tr
                      key={`${attempt.request_id}-${attempt.attempted_at}-${i}`}
                      className="border-t border-border"
                    >
                      <th scope="row" className="p-3">
                        {attempt.request_id}
                      </th>
                      <td className="p-3">{attempt.attempted_at}</td>
                      <td className="p-3">Blocked</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3">No blocked-download attempts recorded.</p>
          )}
        </>
      )}
    </section>
  );
}
