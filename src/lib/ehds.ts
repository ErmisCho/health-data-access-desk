// Mock decision engine for EHDS secondary-use requests.
// Later replaced by the Supabase edge function "requests" (see submitRequest / listRequests).

import { supabase } from "@/integrations/supabase/client";

export type Decision = "REJECT" | "APPROVE_STATISTICAL" | "APPROVE_SPE";

export interface AccessRequest {
  id: string;
  applicant: string;
  purpose: string;
  output: "aggregated" | "individual";
  datasets: string[];
  variables: string[];
  min_cell_size?: number;
}

export interface DecisionResult {
  decision: Decision;
  articles: string[];
  reason: string;
  cohort_size: number;
  spe_status: "not_required" | "provisioned" | "n/a";
  results: { label: string; value: string }[];
  /** true when the result came from the local mock (not the live edge function) */
  mock?: boolean;
}

export const ALLOWED_PURPOSES = [
  "public_health",
  "policy_making",
  "statistics",
  "education",
  "scientific_research",
  "ai_training",
  "personalised_care",
];

export const PROHIBITED_PURPOSES = [
  "insurance_pricing",
  "marketing",
  "employment_decisions",
  "harmful_products",
];

function hashCohort(r: AccessRequest): number {
  const s = r.datasets.join("|") + r.variables.join("|");
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return 200 + (h % 48000);
}

export function decide(r: AccessRequest): DecisionResult {
  const cohort = hashCohort(r);
  if (PROHIBITED_PURPOSES.includes(r.purpose)) {
    return {
      decision: "REJECT",
      articles: ["Art. 54"],
      reason: `Purpose "${r.purpose}" is a prohibited secondary use.`,
      cohort_size: 0,
      spe_status: "n/a",
      results: [],
    };
  }
  if (!ALLOWED_PURPOSES.includes(r.purpose)) {
    return {
      decision: "REJECT",
      articles: ["Art. 53"],
      reason: `Purpose "${r.purpose}" is not among the permitted purposes.`,
      cohort_size: 0,
      spe_status: "n/a",
      results: [],
    };
  }
  if (!r.datasets.length || !r.variables.length) {
    return {
      decision: "REJECT",
      articles: ["Art. 67", "Art. 66"],
      reason: "Application must name at least one dataset and variable (data minimisation).",
      cohort_size: 0,
      spe_status: "n/a",
      results: [],
    };
  }
  if (r.output === "aggregated") {
    if ((r.min_cell_size ?? 0) < 10) {
      return {
        decision: "REJECT",
        articles: ["Art. 69", "Art. 66"],
        reason: "Aggregated output requires a minimum cell size of 10 to remain anonymised.",
        cohort_size: cohort,
        spe_status: "n/a",
        results: [],
      };
    }
    return {
      decision: "APPROVE_STATISTICAL",
      articles: ["Art. 53", "Art. 69"],
      reason: "Anonymised statistical answer can be released as a data request.",
      cohort_size: cohort,
      spe_status: "not_required",
      results: r.variables.map((v, i) => ({
        label: v,
        value: `${(((cohort * (i + 3)) % 997) / 10).toFixed(1)}%`,
      })),
    };
  }
  return {
    decision: "APPROVE_SPE",
    articles: ["Art. 53", "Art. 68", "Art. 73"],
    reason: "Pseudonymised individual-level data: data permit granted, processing only inside the secure processing environment.",
    cohort_size: cohort,
    spe_status: "provisioned",
    results: [
      { label: "Cohort size", value: cohort.toLocaleString("en") },
      { label: "Datasets", value: r.datasets.join(", ") },
      { label: "Workspace", value: `spe-${r.id.toLowerCase()}` },
    ],
  };
}

/** Shape returned by the live "requests" edge function */
interface EdgeFunctionResponse {
  request_id: string;
  decision: Decision;
  articles: string[];
  reason: string;
  answer: Record<string, number | string>;
}

/** Map the edge-function payload to the app's DecisionResult */
export function mapEdgeResponse(data: EdgeFunctionResponse): DecisionResult {
  return {
    decision: data.decision,
    articles: data.articles.map((a) => (a.startsWith("Art.") ? a : `Art. ${a}`)),
    reason: data.reason,
    cohort_size: 0,
    spe_status: "not_required",
    results: Object.entries(data.answer).map(([label, value]) => ({
      label,
      value: String(value),
    })),
  };
}

/** One entry in the samples dropdown */
export interface SampleEntry {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any;
}

const base = { applicant: "", datasets: ["ehr_core"], variables: ["diagnosis"] };

/** Legacy AccessRequest samples (kept for mock fallback testing) */
export const SAMPLES: AccessRequest[] = [
  { ...base, id: "REQ-001", applicant: "Univ. Vienna", purpose: "scientific_research", output: "aggregated", datasets: ["ehr_core", "lab_results"], variables: ["hba1c_over_7", "bmi_over_30"], min_cell_size: 10 },
  { ...base, id: "REQ-002", applicant: "InsureCo AG", purpose: "insurance_pricing", output: "individual" },
  { ...base, id: "REQ-003", applicant: "Charité Berlin", purpose: "scientific_research", output: "individual", datasets: ["ehr_core", "genomics"], variables: ["brca1", "diagnosis"] },
  { ...base, id: "REQ-004", applicant: "Ministry of Health AT", purpose: "policy_making", output: "aggregated", variables: ["covid_vaccinated", "hospitalised"], min_cell_size: 20 },
  { ...base, id: "REQ-005", applicant: "AdTech Ltd", purpose: "marketing", output: "aggregated", min_cell_size: 10 },
  { ...base, id: "REQ-006", applicant: "MedAI GmbH", purpose: "ai_training", output: "individual", datasets: ["imaging"], variables: ["chest_xray", "diagnosis"] },
  { ...base, id: "REQ-007", applicant: "Statistik Austria", purpose: "statistics", output: "aggregated", variables: ["diabetes_prevalence"], min_cell_size: 5 },
  { ...base, id: "REQ-008", applicant: "Unknown Corp", purpose: "product_development", output: "aggregated", min_cell_size: 10 },
  { ...base, id: "REQ-009", applicant: "TU Munich", purpose: "education", output: "aggregated", variables: [], min_cell_size: 10 },
  { ...base, id: "REQ-010", applicant: "Karolinska", purpose: "public_health", output: "individual", datasets: ["ehr_core", "prescriptions"], variables: ["antibiotic_use", "resistance"] },
];

/** The real R07 request body sent to the edge function */
export const R07_REQUEST = {
  id: "R07",
  submitted: "2026-10-29T19:50:00+01:00",
  applicant: {
    name: "Dr. Lukas Fischer",
    organisation: "National statistics office, health statistics unit",
    country: "AT",
  },
  requested_as: "health data request",
  requested_format: "anonymised statistics",
  purpose: "Official statistics on hospital use for the annual health report.",
  question: "How many inpatient stays started in 2025, by the patient's region?",
  definitions: [
    "Inpatient stay = encounter with type 'inpatient'.",
    "Count stays (not patients) whose start_date is in 2025.",
    "Report per region: inpatient stays.",
  ],
};

/** Samples shown in the dropdown — R07 is first and is the default selection */
export const SAMPLE_ENTRIES: SampleEntry[] = [
  { id: "R07", label: "R07 — Inpatient stays 2025 (live data)", request: R07_REQUEST },
  ...SAMPLES.map((s) => ({
    id: s.id,
    label: `${s.id} — ${s.applicant} (${s.purpose})`,
    request: s,
  })),
];

export interface StoredRequest {
  request: AccessRequest;
  result: DecisionResult;
  submitted_at: string;
}

// Mock API — swap bodies for supabase.functions.invoke("requests", ...) later.
const store: StoredRequest[] = SAMPLES.slice(0, 6).map((r, i) => ({
  request: r,
  result: decide(r),
  submitted_at: new Date(Date.UTC(2026, 9, 20 + i, 9)).toISOString(),
}));

export async function submitRequest(r: unknown): Promise<DecisionResult> {
  // Try the live edge function first
  try {
    const { data, error } = await supabase.functions.invoke("requests", { body: r });
    if (!error && data && !data.error) {
      return mapEdgeResponse(data as EdgeFunctionResponse);
    }
    // 501 or any function-level error → fall through to mock
  } catch {
    // Network error → fall through to mock
  }

  // Fallback: run the local mock engine
  await new Promise((res) => setTimeout(res, 400));
  const result = decide(r as AccessRequest);
  result.mock = true;
  store.unshift({ request: r as AccessRequest, result, submitted_at: new Date().toISOString() });
  return result;
}

export async function listRequests(): Promise<StoredRequest[]> {
  return [...store];
}

export async function downloadRequest(_id: string): Promise<{ status: number; message: string }> {
  return { status: 403, message: "Download blocked (403)" };
}
