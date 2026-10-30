import { useEffect, useState } from "react";
import {
  getRequest,
  listRequests,
  reviewRequest,
  type Decision,
  type DecisionResult,
  type RequestHistory,
  type RequestSummary,
} from "@/lib/ehds";
import { DecisionDetails } from "./DecisionDetails";
import { DecisionBadge } from "./DecisionBadge";
import { DataTable } from "./DataTable";
import { EmptyState, ErrorState } from "./States";

const OVERRIDE_DECISIONS: Decision[] = ["REJECT", "APPROVE_STATISTICAL", "APPROVE_SPE"];

function ReviewForm({
  row,
  onDone,
}: {
  row: RequestSummary;
  onDone: () => void;
}) {
  const [action, setAction] = useState<"approve" | "override">("approve");
  const [decision, setDecision] = useState<Decision>("APPROVE_STATISTICAL");
  const [reason, setReason] = useState("");
  const [staffName, setStaffName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = reason.trim().length > 0 && staffName.trim().length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setError("");
    setBusy(true);
    try {
      await reviewRequest({
        action,
        request_id: row.request_id,
        ...(action === "override" ? { decision } : {}),
        reason: reason.trim(),
        staff_name: staffName.trim(),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded border border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950">
      <h4 className="font-semibold text-amber-900 dark:text-amber-100">
        Review request {row.request_id}
      </h4>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`action-${row.request_id}`}
            value="approve"
            checked={action === "approve"}
            onChange={() => setAction("approve")}
          />
          Approve (retain pipeline decision)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`action-${row.request_id}`}
            value="override"
            checked={action === "override"}
            onChange={() => setAction("override")}
          />
          Override decision
        </label>
      </div>
      {action === "override" && (
        <label className="mt-3 block text-sm">
          Override decision
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as Decision)}
            className="mt-1 block w-full max-w-xs rounded border border-input bg-card px-3 py-2 text-foreground"
          >
            {OVERRIDE_DECISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="mt-3 block text-sm">
        <span>
          Reason <span aria-hidden="true">(required)</span>
        </span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the basis for this decision…"
          rows={3}
          maxLength={8000}
          className="mt-1 block w-full rounded border border-input bg-card p-2 text-sm"
          aria-required="true"
        />
      </label>
      <label className="mt-3 block text-sm">
        <span>
          Staff name <span aria-hidden="true">(required)</span>
        </span>
        <input
          type="text"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="Your name for the audit log"
          maxLength={8000}
          className="mt-1 block w-full max-w-xs rounded border border-input bg-card px-3 py-2 text-sm"
          aria-required="true"
        />
      </label>
      {error && <ErrorState>{error}</ErrorState>}
      <button
        onClick={submit}
        disabled={!canSubmit}
        className="mt-3 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        aria-disabled={!canSubmit}
      >
        {busy ? "Submitting…" : action === "approve" ? "Approve" : "Override"}
      </button>
    </div>
  );
}

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
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load history.");
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
        .catch((err) => {
          if (active)
            setDetailError(
              err instanceof Error ? err.message : "Could not load saved result.",
            );
        });
    return () => {
      active = false;
    };
  }, [selectedId, history]);

  const queuedRequests =
    history?.requests.filter((r) => r.status === "staff_review") ?? [];

  function handleReviewDone() {
    setRefresh((n) => n + 1);
  }

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
      {error && <ErrorState>Could not load history: {error}</ErrorState>}

      {history && (
        <>
          {/* ── Review queue ── */}
          <section aria-labelledby="review-queue-heading" className="mt-8">
            <h3
              id="review-queue-heading"
              className="font-display text-xl font-semibold"
            >
              Review queue
              {queuedRequests.length > 0 && (
                <span
                  aria-label={`${queuedRequests.length} awaiting review`}
                  className="ml-2 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-sm font-medium text-white"
                >
                  {queuedRequests.length}
                </span>
              )}
            </h3>
            {queuedRequests.length === 0 ? (
              <EmptyState title="No requests awaiting review." />
            ) : (
              <div className="mt-3 space-y-3">
                {queuedRequests.map((row) => (
                  <div
                    key={`${row.request_id}-${row.submitted_at}`}
                    className="rounded border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-medium">{row.request_id}</span>
                      <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                        Awaiting staff review
                      </span>
                      <DecisionBadge decision={row.decision} />
                      <span className="text-xs text-muted-foreground">{row.submitted_at}</span>
                    </div>
                    <ReviewForm row={row} onDone={handleReviewDone} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Submission history table ── */}
          <div className="mt-8">
            <DataTable caption="Submission history">
              <thead>
                <tr>
                  <th scope="col" className="p-3">
                    Request
                  </th>
                  <th scope="col" className="p-3">
                    Saved at
                  </th>
                  <th scope="col" className="p-3">
                    Decision
                  </th>
                  <th scope="col" className="p-3">
                    Review
                  </th>
                  <th scope="col" className="p-3">
                    Secure environment
                  </th>
                  <th scope="col" className="p-3">
                    Result
                  </th>
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
                    <td className="p-3">
                      <DecisionBadge decision={row.decision} />
                    </td>
                    <td className="p-3">
                      {row.status === "staff_review"
                        ? "Awaiting staff review"
                        : row.last_staff_action
                          ? `Reviewed by ${row.last_staff_action.staff_name}`
                          : "No review needed"}
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
            </DataTable>
          </div>
          {!history.requests.length && <EmptyState title="No saved requests." />}

          {/* ── Detail panel ── */}
          {selectedId && (
            <article className="mt-6 rounded border border-border bg-card p-6">
              <h3 className="font-semibold">Latest saved result — {selectedId}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                For repeated request IDs, this shows the most recent saved response.
              </p>
              {detailError ? (
                <ErrorState>Could not load saved result: {detailError}</ErrorState>
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

          {/* ── Audit log ── */}
          <section aria-labelledby="audit-log-heading" className="mt-8">
            <h3 id="audit-log-heading" className="font-display text-xl font-semibold">
              Audit log
            </h3>
            {history.staff_actions.length ? (
              <div className="mt-3">
                <DataTable caption="Staff audit log">
                  <thead>
                    <tr>
                      <th scope="col" className="p-3">
                        Who
                      </th>
                      <th scope="col" className="p-3">
                        Request
                      </th>
                      <th scope="col" className="p-3">
                        Action
                      </th>
                      <th scope="col" className="p-3">
                        Decision
                      </th>
                      <th scope="col" className="p-3">
                        Reason
                      </th>
                      <th scope="col" className="p-3">
                        When
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.staff_actions.map((a, i) => (
                      <tr
                        key={`${a.request_id}-${a.created_at}-${i}`}
                        className="border-t border-border"
                      >
                        <td className="p-3">{a.staff_name}</td>
                        <td className="p-3 font-mono">{a.request_id}</td>
                        <td className="p-3">{a.action}</td>
                        <td className="p-3">
                          <DecisionBadge decision={a.decision} />
                        </td>
                        <td className="max-w-xs p-3 text-sm">{a.reason}</td>
                        <td className="p-3">
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              </div>
            ) : (
              <EmptyState title="No staff actions recorded." />
            )}
          </section>

          {/* ── Blocked-download log ── */}
          <h3 className="mt-8 font-display text-xl font-semibold">Blocked-download log</h3>
          {history.downloads.length ? (
            <div className="mt-3">
              <DataTable caption="Blocked download attempts">
                <thead>
                  <tr>
                    <th scope="col" className="p-3">
                      Request
                    </th>
                    <th scope="col" className="p-3">
                      Attempted at
                    </th>
                    <th scope="col" className="p-3">
                      Status
                    </th>
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
              </DataTable>
            </div>
          ) : (
            <EmptyState title="No blocked-download attempts recorded." />
          )}
        </>
      )}
    </section>
  );
}
