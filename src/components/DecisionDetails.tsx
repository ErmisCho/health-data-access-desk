import { useState } from "react";
import { downloadRequest, type DecisionResult } from "@/lib/ehds";
import { ResultsTable } from "./ResultsTable";

import { DecisionBadge } from "./DecisionBadge";
import { LifecycleStepper } from "./LifecycleStepper";
import { ExplanationPanel } from "./ExplanationPanel";
import { ErrorState } from "./States";
import { Button } from "./ui/button";
import { useT } from "@/lib/i18n";

export function DecisionDetails({
  result,
  staff = false,
  onDownloadAttempt,
  request,
}: {
  result: DecisionResult;
  staff?: boolean;
  onDownloadAttempt?: () => void;
  request?: { purpose?: string; question?: string } | undefined;
}) {
  const t = useT();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const cohort = result.answer?.["cohort_size"];
  async function download() {
    setBusy(true);
    try {
      setMessage((await downloadRequest(result.request_id)).message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download blocked.");
    } finally {
      setBusy(false);
      onDownloadAttempt?.();
    }
  }
  return (
    <div className="mt-4 space-y-4">
      <DecisionBadge decision={result.decision} />
      <div>
        <Button asChild variant="outline">
          <a href={`/desk/letter/${encodeURIComponent(result.request_id)}`}>
            {t("decision.viewLetter")}
          </a>
        </Button>
      </div>
      <LifecycleStepper
        needsReview={!!result.needs_review}
        timeline={result.timeline}
      />
      {result.needs_review && (
        <p className="font-semibold" role="status">
          {t("decision.needsReview")}
        </p>
      )}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("decision.citedArticles")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {result.articles.map((a) => (
            <span
              key={a}
              className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("decision.reason")}
        </p>
        <p className="mt-1">{result.reason}</p>
      </div>
      {result.explanation && (
        <ExplanationPanel
          explanation={result.explanation}
          purpose={request?.purpose}
          question={request?.question}
          approved={result.decision !== "REJECT"}
        />
      )}
      {result.population && (
        <p>
          {t("decision.eligiblePatients")}{" "}
          <span className="font-mono">{result.population.eligible_patients}</span>
        </p>
      )}
      {result.parse_errors?.length ? (
        <div>
          <p className="font-semibold">{t("decision.definitionsNeedReview")}</p>
          <ul className="list-disc pl-5">
            {result.parse_errors.map((error, i) => (
              <li key={i}>
                {error.definition}: {error.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.decision === "APPROVE_STATISTICAL" && <ResultsTable answer={result.answer} />}
      {(result.decision === "APPROVE_SPE" || staff) && (
        <p>
          {t("decision.cohortSize")}{" "}
          <span className="font-mono">
            {typeof cohort === "number" || typeof cohort === "string"
              ? cohort
              : t("decision.notProvided")}
          </span>
        </p>
      )}
      {staff && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("decision.secureEnv")}
          </p>
          {result.decision === "APPROVE_SPE" ? (
            <>
              <p className="mt-1">
                {result.spe_schema
                  ? `${t("decision.speSchema")} ${result.spe_schema}`
                  : t("decision.provisioningNotProvided")}{" "}
                {t("decision.downloadsBlocked")}
              </p>
              <button
                onClick={download}
                disabled={busy}
                className="mt-2 rounded border border-input px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
              >
                {busy ? t("decision.checking") : t("decision.download")}
              </button>
              {message && <ErrorState>{message}</ErrorState>}
            </>
          ) : (
            <p className="mt-1">
              {result.decision === "REJECT"
                ? t("decision.notApplicable")
                : t("decision.notRequired")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
