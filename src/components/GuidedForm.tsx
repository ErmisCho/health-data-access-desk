/**
 * GuidedForm — Issue #43 / #55
 * Step-by-step request form with live "We understood" preview panel.
 * i18n: all visible strings come from useT().
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  previewRequest,
  SAMPLE_ENTRIES,
  submitRequest,
  type AccessRequest,
  type DecisionResult,
  type PreviewResult,
} from "@/lib/ehds";
import { DecisionDetails } from "@/components/DecisionDetails";
import { DecisionBadge } from "@/components/DecisionBadge";
import { ErrorState, EmptyState } from "@/components/States";
import { useLang, useT } from "@/lib/i18n";
import { localizeBackendText } from "@/lib/i18n/translations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 1 | 2 | 3;
const STEPS = [1, 2, 3] as Step[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function blankRequest(): AccessRequest {
  return {
    id: `req-${Date.now()}`,
    submitted: new Date().toISOString(),
    applicant: { name: "", organisation: "", country: "" },
    requested_as: "health data request",
    requested_format: "anonymised statistics",
    purpose: "",
    question: "",
    definitions: [""],
  };
}

function toRequest(form: AccessRequest): AccessRequest {
  return {
    ...form,
    definitions: form.definitions.filter((d) => d.trim().length > 0),
  };
}

// EU and EEA countries; Austria and Germany first, the rest by localized name.
const COUNTRIES = ["BE", "BG", "CY", "CZ", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK"];

function countryOptions(lang: string, current: string): [string, string][] {
  const names = new Intl.DisplayNames([lang], { type: "region" });
  const name = (code: string) => names.of(code) ?? code;
  // Keep an imported code outside the list selectable instead of dropping it.
  const rest = current && !["AT", "DE", ...COUNTRIES].includes(current) ? [...COUNTRIES, current] : COUNTRIES;
  return [
    ["AT", name("AT")],
    ["DE", name("DE")],
    ...rest.map((code): [string, string] => [code, name(code)]).sort((x, y) => x[1].localeCompare(y[1], lang)),
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StepNav({
  current,
  onChange,
  stepLabels,
}: {
  current: Step;
  onChange: (s: Step) => void;
  stepLabels: Record<Step, string>;
}) {
  const t = useT();
  return (
    <nav aria-label={t("form.steps.aria")} className="mb-6 flex flex-wrap gap-2">
      {STEPS.map((s) => (
        <button
          key={s}
          type="button"
          aria-current={s === current ? "step" : undefined}
          onClick={() => onChange(s)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            s === current
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {s}. {stepLabels[s]}
        </button>
      ))}
    </nav>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "block w-full rounded border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const textareaCls =
  "block w-full rounded border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

// ---------------------------------------------------------------------------
// Preview panel
// ---------------------------------------------------------------------------
function WeUnderstoodPanel({ preview }: { preview: PreviewResult }) {
  const t = useT();
  const { lang } = useLang();
  return (
    <section
      aria-label={t("form.weUnderstood")}
      className="rounded border border-border bg-muted/30 p-4 space-y-3"
    >
      <p className="text-base font-semibold">
        {t(
          preview.needs_review
            ? "form.likely.held"
            : preview.decision === "APPROVE_STATISTICAL"
              ? "form.likely.APPROVE_STATISTICAL"
              : preview.decision === "APPROVE_SPE"
                ? "form.likely.APPROVE_SPE"
                : "form.likely.REJECT",
        )}
      </p>
      <h3 className="font-semibold text-sm">{t("form.weUnderstood")}</h3>
      <DecisionBadge decision={preview.decision} />
      <p className="text-sm">{localizeBackendText(preview.reason, lang)}</p>
      {preview.rule && <p className="text-sm">{localizeBackendText(preview.rule, lang)}</p>}
      {preview.plan_summary && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t("form.weUnderstood.plan")}</span>
          {preview.plan_summary}
        </p>
      )}
      {preview.articles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {preview.articles.map((a) => (
            <span
              key={a}
              className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs"
            >
              {a}
            </span>
          ))}
        </div>
      )}
      {preview.needs_review && (
        <p
          className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-300"
          role="status"
        >
          {t("form.weUnderstood.staffReview")}
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function GuidedForm({
  onResult,
  onChange,
}: {
  onResult: (result: DecisionResult, request: AccessRequest) => void;
  onChange?: () => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<AccessRequest>(blankRequest());
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisionRef = useRef(0);
  useEffect(() => () => {
    revisionRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function invalidateResult() {
    revisionRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreview(null);
    setPreviewError("");
    onChange?.();
  }

  const STEP_LABELS: Record<Step, string> = {
    1: t("form.step1"),
    2: t("form.step2"),
    3: t("form.step3"),
  };

  // ── Sample loader ──────────────────────────────────────────────────────────
  function loadSample(index: number) {
    const entry = SAMPLE_ENTRIES[index];
    if (!entry) return;
    invalidateResult();
    const next = {
      ...entry.request,
      definitions:
        entry.request.definitions.length > 0 ? entry.request.definitions : [""],
    };
    setForm(next);
    setPreview(null);
    setSubmitError("");
    triggerPreview(next);
  }

  // ── Debounced preview ──────────────────────────────────────────────────────
  const triggerPreview = useCallback((current: AccessRequest) => {
    const revision = revisionRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const req = toRequest(current);
    if (
      !req.purpose.trim() ||
      !req.question.trim() ||
      !req.requested_as ||
      req.definitions.length === 0
    ) {
      setPreview(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await previewRequest(req);
        if (revision !== revisionRef.current) return;
        setPreview(result);
        setPreviewError("");
      } catch (e) {
        if (revision !== revisionRef.current) return;
        setPreviewError(e instanceof Error ? e.message : "Preview unavailable.");
      }
    }, 600);
  }, []);

  function setField<K extends keyof AccessRequest>(key: K, value: AccessRequest[K]) {
    invalidateResult();
    setForm((f) => {
      const next = { ...f, [key]: value };
      triggerPreview(next);
      return next;
    });
  }

  function setApplicantField(key: keyof AccessRequest["applicant"], value: string) {
    invalidateResult();
    setForm((f) => ({ ...f, applicant: { ...f.applicant, [key]: value } }));
  }

  function setDefinition(index: number, value: string) {
    invalidateResult();
    setForm((f) => {
      const defs = [...f.definitions];
      defs[index] = value;
      const next = { ...f, definitions: defs };
      triggerPreview(next);
      return next;
    });
  }

  function addDefinition() {
    invalidateResult();
    setForm((f) => ({ ...f, definitions: [...f.definitions, ""] }));
  }

  function removeDefinition(index: number) {
    invalidateResult();
    setForm((f) => {
      const defs = f.definitions.filter((_, i) => i !== index);
      const next = { ...f, definitions: defs.length > 0 ? defs : [""] };
      triggerPreview(next);
      return next;
    });
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function exportJson() {
    const blob = new Blob([JSON.stringify(toRequest(form), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.id || "request"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  function applyImport(text: string) {
    try {
      const parsed = JSON.parse(text) as Partial<AccessRequest>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setImportError(t("form.importMustBeObject"));
        return;
      }
      invalidateResult();
      setForm({
        id: typeof parsed.id === "string" ? parsed.id : `req-${Date.now()}`,
        submitted:
          typeof parsed.submitted === "string"
            ? parsed.submitted
            : new Date().toISOString(),
        applicant:
          parsed.applicant &&
          typeof parsed.applicant === "object" &&
          !Array.isArray(parsed.applicant)
            ? {
                name: String(parsed.applicant.name ?? ""),
                organisation: String(parsed.applicant.organisation ?? ""),
                country: String(parsed.applicant.country ?? ""),
              }
            : { name: "", organisation: "", country: "" },
        requested_as:
          parsed.requested_as === "health data request" ||
          parsed.requested_as === "health data access application"
            ? parsed.requested_as
            : "health data request",
        requested_format:
          parsed.requested_format === "pseudonymised records"
            ? "pseudonymised records"
            : "anonymised statistics",
        purpose: typeof parsed.purpose === "string" ? parsed.purpose : "",
        question: typeof parsed.question === "string" ? parsed.question : "",
        definitions: Array.isArray(parsed.definitions)
          ? (parsed.definitions as string[]).filter(
              (d): d is string => typeof d === "string",
            )
          : [""],
      });
      setShowImport(false);
      setImportText("");
      setImportError("");
      setPreview(null);
    } catch {
      setImportError(t("form.couldNotParseJson"));
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") applyImport(text);
    };
    reader.readAsText(file);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const revision = revisionRef.current;
    setSubmitError("");
    setBusy(true);
    try {
      const req = toRequest(form);
      const result = await submitRequest(req);
      if (revision === revisionRef.current) onResult(result, req);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : t("form.requestFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  const unreadableIndices = new Set(preview?.unreadable.map((u) => u.index) ?? []);
  const unreadableByIndex = Object.fromEntries(
    (preview?.unreadable ?? []).map((u) => [u.index, u.reason]),
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toolbar: samples + import + export */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="guided-sample" className="block text-sm font-medium mb-1">
            {t("form.loadSample")}
          </label>
          <select
            id="guided-sample"
            className={inputCls}
            disabled={busy}
            defaultValue=""
            onChange={(e) => {
              const i = Number(e.target.value);
              if (!isNaN(i)) loadSample(i);
            }}
          >
            <option value="" disabled>
              {t("form.chooseSample")}
            </option>
            {SAMPLE_ENTRIES.map((s, i) => (
              <option key={s.id} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="rounded border border-border bg-card px-4 py-2">
        <summary className="cursor-pointer text-sm font-medium">{t("form.advanced")}</summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="rounded border border-input px-3 py-2 text-sm hover:bg-muted"
            >
              {t("form.importJson")}
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="rounded border border-input px-3 py-2 text-sm hover:bg-muted"
            >
              {t("form.exportJson")}
            </button>
          </div>
          {/* Import panel */}
          {showImport && (
            <div className="rounded border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-medium">{t("form.pasteOrUpload")}</p>
              <textarea
                aria-label="Paste JSON for import"
                value={importText}
                onChange={(e) => { invalidateResult(); setImportText(e.target.value); }}
                rows={5}
                className={textareaCls}
                placeholder='{ "requested_as": "...", ... }'
              />
              {importError && <p className="text-xs text-destructive">{importError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyImport(importText)}
                  className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
                >
                  {t("form.apply")}
                </button>
                <label className="cursor-pointer rounded border border-input px-3 py-1.5 text-sm hover:bg-muted">
                  {t("form.uploadFile")}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="sr-only"
                    onChange={handleFileImport}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Step navigation */}
      <StepNav current={step} onChange={setStep} stepLabels={STEP_LABELS} />

      {/* Step content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5 min-w-0">
          {/* Step 1: What you want to know */}
          {step === 1 && (
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold">{t("form.step1")}</legend>
              <Field id="g-question" label={t("form.question.label")}>
                <textarea
                  id="g-question"
                  rows={4}
                  value={form.question}
                  onChange={(e) => setField("question", e.target.value)}
                  className={textareaCls}
                  placeholder={t("form.question.placeholder")}
                />
              </Field>
              <Field id="g-purpose" label={t("form.purpose.label")}>
                <textarea
                  id="g-purpose"
                  rows={5}
                  value={form.purpose}
                  onChange={(e) => setField("purpose", e.target.value)}
                  className={textareaCls}
                  placeholder={t("form.purpose.placeholder")}
                />
              </Field>
              <Field id="g-requested-as" label={t("form.requestType.requestedAs")}>
                <select
                  id="g-requested-as"
                  value={form.requested_as}
                  onChange={(e) =>
                    setField("requested_as", e.target.value as AccessRequest["requested_as"])
                  }
                  className={inputCls}
                >
                  <option value="health data request">{t("form.requestType.healthDataRequest")}</option>
                  <option value="health data access application">
                    {t("form.requestType.healthDataAccessApplication")}
                  </option>
                </select>
              </Field>
              <Field id="g-requested-format" label={t("form.requestType.requestedFormat")}>
                <select
                  id="g-requested-format"
                  value={form.requested_format}
                  onChange={(e) =>
                    setField(
                      "requested_format",
                      e.target.value as AccessRequest["requested_format"],
                    )
                  }
                  className={inputCls}
                >
                  <option value="anonymised statistics">{t("form.requestType.anonymisedStatistics")}</option>
                  <option value="pseudonymised records">{t("form.requestType.pseudonymisedRecords")}</option>
                </select>
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {t("form.next")}
                </button>
              </div>
            </fieldset>
          )}

          {/* Step 2: Definitions */}
          {step === 2 && (
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold">{t("form.definitions.legend")}</legend>
              <p className="text-sm text-muted-foreground">{t("form.definitions.hint")}</p>
              <ul className="space-y-2" aria-label={t("form.definitions.ariaLabel")}>
                {form.definitions.map((def, i) => {
                  const isUnreadable = unreadableIndices.has(i);
                  return (
                    <li key={i} className="space-y-1">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                          <label htmlFor={`g-def-${i}`} className="sr-only">
                            {`Definition ${i + 1}`}
                          </label>
                          <input
                            id={`g-def-${i}`}
                            type="text"
                            value={def}
                            onChange={(e) => setDefinition(i, e.target.value)}
                            aria-invalid={isUnreadable}
                            aria-describedby={isUnreadable ? `g-def-${i}-err` : undefined}
                            className={`${inputCls} ${isUnreadable ? "border-destructive focus:ring-destructive" : ""}`}
                            placeholder={`${t("form.definitions.placeholder")} ${i + 1}`}
                          />
                          {isUnreadable && (
                            <p
                              id={`g-def-${i}-err`}
                              role="alert"
                              className="text-xs text-destructive"
                            >
                              {localizeBackendText(unreadableByIndex[i] ?? "", lang)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`${t("form.definitions.remove")} ${i + 1}`}
                          onClick={() => removeDefinition(i)}
                          disabled={form.definitions.length === 1}
                          className="mt-0.5 rounded border border-input px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-40"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={addDefinition}
                className="rounded border border-input px-3 py-1.5 text-sm hover:bg-muted"
              >
                {t("form.definitions.add")}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded border border-input px-4 py-2 text-sm hover:bg-muted"
                >
                  {t("form.back")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {t("form.next")}
                </button>
              </div>
            </fieldset>
          )}

          {/* Step 3: About you, review & submit */}
          {step === 3 && (
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold">{t("form.step3")}</legend>
              <Field id="g-name" label={t("form.applicant.name")}>
                <input
                  id="g-name"
                  type="text"
                  autoComplete="name"
                  value={form.applicant.name}
                  onChange={(e) => setApplicantField("name", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field id="g-org" label={t("form.applicant.org")}>
                <input
                  id="g-org"
                  type="text"
                  autoComplete="organization"
                  value={form.applicant.organisation}
                  onChange={(e) => setApplicantField("organisation", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field id="g-country" label={t("form.applicant.country")}>
                <select
                  id="g-country"
                  autoComplete="country"
                  value={form.applicant.country}
                  onChange={(e) => setApplicantField("country", e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("form.applicant.chooseCountry")}</option>
                  {countryOptions(lang, form.applicant.country).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  ))}
                </select>
              </Field>
              <dl className="rounded border border-border bg-card p-4 text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">{t("form.review.applicant")}</dt>
                  <dd>{form.applicant.name || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">{t("form.review.organisation")}</dt>
                  <dd>{form.applicant.organisation || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">{t("form.review.country")}</dt>
                  <dd>{form.applicant.country || "—"}</dd>
                </div>
                <div className="flex gap-2">
                   <dt className="font-medium w-32 shrink-0">{t("form.review.requestedAs")}</dt>
                   <dd>{form.requested_as === "health data access application"
                     ? t("enum.requestedAs.healthDataAccessApplication")
                     : t("enum.requestedAs.healthDataRequest")}</dd>
                 </div>
                 <div className="flex gap-2">
                   <dt className="font-medium w-32 shrink-0">{t("form.review.format")}</dt>
                   <dd>{form.requested_format === "pseudonymised records"
                     ? t("enum.requestedFormat.pseudonymisedRecords")
                     : t("enum.requestedFormat.anonymisedStatistics")}</dd>
                 </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">{t("form.review.purpose")}</dt>
                  <dd className="line-clamp-3">{form.purpose || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">{t("form.review.question")}</dt>
                  <dd className="line-clamp-3">{form.question || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-32 shrink-0">{t("form.review.definitions")}</dt>
                  <dd>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      {toRequest(form).definitions.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ol>
                  </dd>
                </div>
              </dl>
              {submitError && <ErrorState>{submitError}</ErrorState>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded border border-input px-4 py-2 text-sm hover:bg-muted"
                >
                  {t("form.back")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy}
                  className="rounded bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? t("form.submitting") : t("form.submit")}
                </button>
              </div>
            </fieldset>
          )}
        </div>

        {/* Live preview panel */}
        <div className="min-w-0 space-y-3">
          <h3 className="font-semibold text-sm">{t("form.livePreview")}</h3>
          {preview ? (
            <WeUnderstoodPanel preview={preview} />
          ) : previewError ? (
            <p className="text-xs text-muted-foreground">{previewError}</p>
          ) : (
            <EmptyState title={t("form.emptyPreview")} />
          )}
        </div>
      </div>
    </div>
  );
}
