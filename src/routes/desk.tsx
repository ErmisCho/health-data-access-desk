import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SAMPLE_ENTRIES, submitRequest, type AccessRequest, type DecisionResult } from "@/lib/ehds";
import { DecisionDetails } from "@/components/DecisionDetails";
import { GuidedForm } from "@/components/GuidedForm";
import { EmptyState, ErrorState } from "@/components/States";
import { usePreferences } from "@/lib/preferences";
import { useT } from "@/lib/i18n";

const StaffHistory = lazy(() =>
  import("@/components/StaffHistory").then((m) => ({ default: m.StaffHistory })),
);
const DemoPanel = lazy(() =>
  import("@/components/DemoPanel").then((m) => ({ default: m.DemoPanel })),
);

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
  const { role, setRole } = usePreferences();
  const t = useT();
  // Preserve existing demo links; later header changes remain authoritative.
  useEffect(() => { if (view === "demo") setRole("demo"); }, [view, setRole]);
  useEffect(() => { document.title = t("page.title.desk"); }, [t]);
  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-6 py-10">
        <div hidden={role !== "applicant"}>
          <Applicant />
        </div>
        {role === "staff" && (
          <Suspense fallback={<p role="status">{t("staff.loading")}</p>}>
            <StaffHistory />
          </Suspense>
        )}
        {role === "demo" && (
          <Suspense fallback={null}>
            <DemoPanel />
          </Suspense>
        )}
      </main>
    </div>
  );
}

type ApplicantTab = "guided" | "json";

function Applicant() {
  const [tab, setTab] = useState<ApplicantTab>("guided");
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<AccessRequest | null>(null);
  const t = useT();

  function clearResult() {
    setResult(null);
    setSubmittedRequest(null);
  }

  function handleResult(r: DecisionResult, req: AccessRequest) {
    setResult(r);
    setSubmittedRequest(req);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">{t("desk.applicant.heading")}</h1>
        <div
          className="flex rounded border border-border p-1"
          aria-label={t("desk.inputMode")}
        >
          {(["guided", "json"] as ApplicantTab[]).map((tabKey) => (
            <button
              key={tabKey}
              aria-pressed={tab === tabKey}
              onClick={() => { if (tab !== tabKey) clearResult(); setTab(tabKey); }}
              className={`rounded px-4 py-1 text-sm font-medium capitalize ${tab === tabKey ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {tabKey === "guided" ? t("desk.tab.guided") : t("desk.tab.json")}
            </button>
          ))}
        </div>
      </div>

      {tab === "guided" && (
        <GuidedForm onResult={handleResult} onChange={clearResult} />
      )}

      {tab === "json" && (
        <JsonEditor onResult={handleResult} onChange={clearResult} />
      )}

      {result && submittedRequest && (
        <section aria-live="polite" className="rounded border border-border bg-card p-6">
          <h2 className="font-display text-2xl font-semibold mb-4">{t("desk.decision.heading")}</h2>
          <DecisionDetails
            key={JSON.stringify(result)}
            result={result}
            request={{ purpose: submittedRequest.purpose, question: submittedRequest.question }}
          />
        </section>
      )}
    </div>
  );
}

function JsonEditor({
  onResult,
  onChange,
}: {
  onResult: (result: DecisionResult, req: AccessRequest) => void;
  onChange: () => void;
}) {
  const [text, setText] = useState(JSON.stringify(SAMPLE_ENTRIES[0]!.request, null, 2));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const revisionRef = useRef(0);
  useEffect(() => () => { revisionRef.current += 1; }, []);
  const t = useT();
  async function submit() {
    const revision = revisionRef.current;
    setError("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    setBusy(true);
    try {
      const result = await submitRequest(parsed);
      const source = parsed as Record<string, unknown>;
      const req: AccessRequest = {
        id: typeof source["id"] === "string" ? source["id"] : "",
        submitted: typeof source["submitted"] === "string" ? source["submitted"] : new Date().toISOString(),
        applicant:
          source["applicant"] && typeof source["applicant"] === "object" && !Array.isArray(source["applicant"])
            ? {
                name: String((source["applicant"] as Record<string, unknown>)["name"] ?? ""),
                organisation: String((source["applicant"] as Record<string, unknown>)["organisation"] ?? ""),
                country: String((source["applicant"] as Record<string, unknown>)["country"] ?? ""),
              }
            : { name: "", organisation: "", country: "" },
        requested_as:
          source["requested_as"] === "health data access application"
            ? "health data access application"
            : "health data request",
        requested_format:
          source["requested_format"] === "pseudonymised records"
            ? "pseudonymised records"
            : "anonymised statistics",
        purpose: typeof source["purpose"] === "string" ? source["purpose"] : "",
        question: typeof source["question"] === "string" ? source["question"] : "",
        definitions: Array.isArray(source["definitions"])
          ? (source["definitions"] as string[]).filter((d): d is string => typeof d === "string")
          : [],
      };
      if (revision === revisionRef.current) onResult(result, req);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("form.requestFailed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <label className="block text-sm text-muted-foreground">
        {t("form.sampleRequest")}
        <select
          disabled={busy}
          className="mt-1 block w-full rounded border border-input bg-card px-3 py-2 text-foreground"
          onChange={(e) => {
            onChange();
            setText(JSON.stringify(SAMPLE_ENTRIES[+e.target.value]!.request, null, 2));
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
          onChange();
          setText(e.target.value);
        }}
        className="h-80 w-full rounded border border-input bg-card p-3 font-mono text-sm"
      />
      {error && <ErrorState>{error}</ErrorState>}
      <button
        onClick={submit}
        disabled={busy}
        className="rounded bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("form.evaluating") : t("form.submit")}
      </button>
    </div>
  );
}
