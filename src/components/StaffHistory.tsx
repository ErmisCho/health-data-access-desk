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
import { useT, useLang } from "@/lib/i18n";
import { localizeBackendText } from "@/lib/i18n/translations";
import { StaffSignIn, StaffSignedInBadge, type StaffSession } from "./StaffSignIn";

const OVERRIDE_DECISIONS: Decision[] = ["REJECT", "APPROVE_STATISTICAL", "APPROVE_SPE"];

// One-click reasons: each sets the action (and override decision) and fills the editable reason.
const REASON_TEMPLATES = [
  { key: "staff.template.approve", action: "approve", decision: undefined },
  { key: "staff.template.reject", action: "override", decision: "REJECT" },
  { key: "staff.template.statistics", action: "override", decision: "APPROVE_STATISTICAL" },
  { key: "staff.template.spe", action: "override", decision: "APPROVE_SPE" },
] as const;

const BADGE_KEY = {
  REJECT: "badge.REJECT",
  APPROVE_STATISTICAL: "badge.APPROVE_STATISTICAL",
  APPROVE_SPE: "badge.APPROVE_SPE",
} as const;

// shortcut: the 3-month limit of Art. 68(4)/69(4) counted from submission; the saved result carries the exact deadline.
function dueDate(submitted: string): Date | null {
  const d = new Date(submitted);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + 3);
  return d;
}

function ReviewForm({
  row,
  onDone,
}: {
  row: RequestSummary;
  onDone: () => void;
}) {
  const t = useT();
  const [action, setAction] = useState<"approve" | "override">("approve");
  const [decision, setDecision] = useState<Decision>("APPROVE_STATISTICAL");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = reason.trim().length > 0 && !busy;

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
        {t("staff.review.heading")} {row.request_id}
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
          {t("staff.review.approve")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`action-${row.request_id}`}
            value="override"
            checked={action === "override"}
            onChange={() => setAction("override")}
          />
          {t("staff.review.override")}
        </label>
      </div>
      {action === "override" && (
        <label className="mt-3 block text-sm">
          {t("staff.review.overrideLabel")}
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as Decision)}
            className="mt-1 block w-full max-w-xs rounded border border-input bg-card px-3 py-2 text-foreground"
          >
            {OVERRIDE_DECISIONS.map((d) => (
              <option key={d} value={d}>
                {t(BADGE_KEY[d])}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("staff.template.label")}>
        {REASON_TEMPLATES.map((tpl) => (
          <button
            key={tpl.key}
            type="button"
            onClick={() => {
              setAction(tpl.action);
              if (tpl.decision) setDecision(tpl.decision);
              setReason(t(tpl.key));
            }}
            className="rounded-full border border-input bg-card px-3 py-1 text-xs hover:bg-muted"
          >
            {t(`${tpl.key}.label`)}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-sm">
        <span>
          {t("staff.review.reason")}{" "}
          <span aria-hidden="true">{t("staff.review.reasonRequired")}</span>
        </span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("staff.review.reasonPlaceholder")}
          rows={3}
          maxLength={8000}
          className="mt-1 block w-full rounded border border-input bg-card p-2 text-sm"
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
        {busy
          ? t("staff.review.submitting")
          : action === "approve"
            ? t("staff.review.approveBtn")
            : t("staff.review.overrideBtn")}
      </button>
    </div>
  );
}

function fmtDate(raw: string, locale: string): string {
  if (!raw) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString(locale);
}

export function StaffHistory() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "de" ? "de-AT" : "en-GB";
  const [session, setSession] = useState<StaffSession | null>(null);
  const [history, setHistory] = useState<RequestHistory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!session) return;
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
  }, [session, refresh]);

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

  const queuedRequests = (history?.requests.filter((r) => r.status === "staff_review") ?? [])
    .slice()
    .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));

  function handleReviewDone() {
    setRefresh((n) => n + 1);
  }

  if (!session) {
    return (
      <StaffSignIn
        onSignedIn={(s) => {
          setSession(s);
          // useEffect([session, refresh]) fires automatically when session changes.
        }}
      />
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">{t("staff.pastRequests")}</h2>
        <div className="flex items-center gap-3">
          <StaffSignedInBadge
            session={session}
            onSignOut={() => {
              setSession(null);
              setHistory(null);
            }}
          />
          <button
            disabled={loading}
            onClick={() => setRefresh((n) => n + 1)}
            className="rounded border border-input px-3 py-1 text-sm disabled:opacity-50"
          >
            {t("staff.refreshHistory")}
          </button>
        </div>
      </div>

      {loading && (
        <p role="status" className="mt-4">
          {t("staff.loading")}
        </p>
      )}
      {error && (
        <ErrorState>
          {t("staff.loadError")} {error}
        </ErrorState>
      )}

      {history && (
        <>
          {/* ── Review queue ── */}
          <section aria-labelledby="review-queue-heading" className="mt-8">
            <h3
              id="review-queue-heading"
              className="font-display text-xl font-semibold"
            >
              {t("staff.queue.heading")}
              {queuedRequests.length > 0 && (
                <span
                  aria-label={`${queuedRequests.length} ${t("staff.queue.awaiting")}`}
                  className="ml-2 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-sm font-medium text-white"
                >
                  {queuedRequests.length}
                </span>
              )}
            </h3>
            {queuedRequests.length === 0 ? (
              <EmptyState title={t("staff.queue.empty")} />
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
                        {t("staff.queue.awaitingBadge")}
                      </span>
                      <DecisionBadge decision={row.decision} />
                      <span className="text-xs text-muted-foreground">{fmtDate(row.submitted_at, locale)}</span>
                      {dueDate(row.submitted_at) && (
                        <span className="text-xs font-medium">
                          {t("staff.queue.due")}{" "}
                          {dueDate(row.submitted_at)!.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <ReviewForm row={row} onDone={handleReviewDone} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Submission history table ── */}
          <div className="mt-8">
            <DataTable caption={t("staff.history.caption")}>
              <thead>
                <tr>
                  <th scope="col" className="p-3">
                    {t("staff.col.request")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("staff.col.savedAt")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("staff.col.decision")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("staff.col.review")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("staff.col.secureEnv")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("staff.col.result")}
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
                    <td className="p-3">{fmtDate(row.submitted_at, locale)}</td>
                    <td className="p-3">
                      <DecisionBadge decision={row.decision} />
                    </td>
                    <td className="p-3">
                      {row.status === "staff_review"
                        ? t("staff.row.awaitingReview")
                        : row.last_staff_action
                          ? `${t("staff.row.reviewedBy")} ${row.last_staff_action.staff_name}`
                          : t("staff.row.noReview")}
                    </td>
                    <td className="p-3">
                      {row.spe_schema
                        ? `${row.spe_schema} ${t("staff.row.speInfo")}`
                        : t("staff.row.noSpe")}
                    </td>
                    <td className="p-3">
                      <button
                        aria-pressed={selectedId === row.request_id}
                        onClick={() => setSelectedId(row.request_id)}
                        className="rounded border border-input px-3 py-1"
                      >
                        {t("staff.row.viewResult")} {row.request_id}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
          {!history.requests.length && <EmptyState title={t("staff.noRequests")} />}

          {/* ── Detail panel ── */}
          {selectedId && (
            <article className="mt-6 rounded border border-border bg-card p-6">
              <h3 className="font-semibold">
                {t("staff.detail.title")} {selectedId}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("staff.detail.note")}
              </p>
              {detailError ? (
                <ErrorState>
                  {t("staff.detail.loadError")} {detailError}
                </ErrorState>
              ) : result && result.request_id === selectedId ? (
                <DecisionDetails
                  key={selectedId}
                  result={result}
                  staff
                  onDownloadAttempt={() => setRefresh((n) => n + 1)}
                />
              ) : (
                <p role="status" className="mt-4">
                  {t("staff.detail.loading")}
                </p>
              )}
            </article>
          )}

          {/* ── Audit log ── */}
          <section aria-labelledby="audit-log-heading" className="mt-8">
            <h3 id="audit-log-heading" className="font-display text-xl font-semibold">
              {t("staff.audit.heading")}
            </h3>
            {history.staff_actions.length ? (
              <div className="mt-3">
                <DataTable caption={t("staff.audit.caption")}>
                  <thead>
                    <tr>
                      <th scope="col" className="p-3">
                        {t("staff.audit.col.who")}
                      </th>
                      <th scope="col" className="p-3">
                        {t("staff.audit.col.request")}
                      </th>
                      <th scope="col" className="p-3">
                        {t("staff.audit.col.action")}
                      </th>
                      <th scope="col" className="p-3">
                        {t("staff.audit.col.decision")}
                      </th>
                      <th scope="col" className="p-3">
                        {t("staff.audit.col.reason")}
                      </th>
                      <th scope="col" className="p-3">
                        {t("staff.audit.col.when")}
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
                        <td className="max-w-xs p-3 text-sm">{localizeBackendText(a.reason, lang)}</td>
                        <td className="p-3">
                         {fmtDate(a.created_at, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              </div>
            ) : (
              <EmptyState title={t("staff.audit.empty")} />
            )}
          </section>

          {/* ── Blocked-download log ── */}
          <h3 className="mt-8 font-display text-xl font-semibold">
            {t("staff.download.heading")}
          </h3>
          {history.downloads.length ? (
            <div className="mt-3">
              <DataTable caption={t("staff.download.caption")}>
                <thead>
                  <tr>
                    <th scope="col" className="p-3">
                      {t("staff.download.col.request")}
                    </th>
                    <th scope="col" className="p-3">
                      {t("staff.download.col.attemptedAt")}
                    </th>
                    <th scope="col" className="p-3">
                      {t("staff.download.col.status")}
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
                      <td className="p-3">{fmtDate(attempt.attempted_at, locale)}</td>
                      <td className="p-3">{t("staff.download.blocked")}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          ) : (
            <EmptyState title={t("staff.download.empty")} />
          )}
        </>
      )}
    </section>
  );
}
