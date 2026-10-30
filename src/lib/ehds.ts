import { hdabHeaders } from "./hdab-selection";
import { supabase } from "@/integrations/supabase/client";
export { SAMPLE_ENTRIES, type AccessRequest } from "./requests";

export type Decision = "REJECT" | "APPROVE_STATISTICAL" | "APPROVE_SPE";

export interface RegisterEntry {
  reference: string;
  date: string;
  organisation_type: string;
  purpose_category: string;
  decision: Decision;
  articles: string[];
}

export async function listRegister(): Promise<{ entries: RegisterEntry[] }> {
  return requireData<{ entries: RegisterEntry[] }>(
    await supabase.functions.invoke("register", { method: "GET" }),
  );
}

export interface PreviewUnreadable {
  index: number;
  definition: string;
  reason: string;
}

export interface PreviewResult {
  decision: Decision;
  articles: string[];
  reason: string;
  needs_review: boolean;
  status: "staff_review" | "decided";
  rule: string;
  trigger_phrases: string[];
  plan_summary?: string;
  unreadable: PreviewUnreadable[];
}
export type AnswerValue = number | string;
export type Answer = { [key: string]: AnswerValue | Answer };
export interface LegalArticle {
  number: string;
  title: string;
  summary: string;
  quote: string;
  ref: string;
  point?: string | null;
  applies?: string | null;
}
export interface DecisionExplanation {
  rule: string;
  trigger_phrases: string[];
  trigger_context?: string[];
  articles: LegalArticle[];
  plan_summary?: string;
}
export interface TimelineEvent {
  status: "submitted" | "assessed" | "staff_review" | "decided" | "fulfilled";
  at: string;
}

export interface DecisionResult {
  request_id: string;
  decision: Decision;
  articles: string[];
  reason: string;
  answer: Answer | null;
  needs_review?: boolean;
  status?: "staff_review" | "decided";
  spe_schema?: string;
  parse_errors?: { definition: string; reason: string }[];
  explanation?: DecisionExplanation;
  population?: { eligible_patients: number };
  timeline?: TimelineEvent[];
}
export interface StaffAction {
  request_id: string;
  action: "approve" | "override";
  decision: Decision;
  reason: string;
  staff_name: string;
  created_at: string;
}
export interface RequestSummary {
  request_id: string;
  submitted_at: string;
  decision: Decision;
  articles: string[];
  needs_review: boolean;
  status: "staff_review" | "decided";
  spe_schema: string | null;
  last_staff_action: StaffAction | null;
}
export interface RequestHistory {
  requests: RequestSummary[];
  downloads: { request_id: string; attempted_at: string }[];
  staff_actions: StaffAction[];
}

export interface StaffReviewBody {
  action: "approve" | "override";
  request_id: string;
  decision?: Decision;
  reason: string;
  // staff_name is no longer accepted from the client; the backend derives it
  // from the verified Auth session token.
}

export function mapEdgeResponse(data: DecisionResult): DecisionResult {
  return { ...data, articles: data.articles.map((a) => (a.startsWith("Art.") ? a : `Art. ${a}`)) };
}

// FunctionsHttpError exposes the response in context, including non-2xx JSON bodies.
async function functionError(
  error: unknown,
  data: unknown,
): Promise<{ status: number | undefined; message: string }> {
  const e = error as { context?: Response; message?: string } | null;
  let payload = data as { error?: string } | null;
  if (e?.context && typeof e.context.json === "function") {
    try {
      payload = await e.context.clone().json();
    } catch {
      /* Keep the transport error if the body is not JSON. */
    }
  }
  return {
    status: e?.context?.status,
    message:
      typeof payload?.error === "string"
        ? payload.error
        : e?.message || "The backend returned an invalid response.",
  };
}

async function requireData<T>(response: { data: T | null; error: unknown }): Promise<T> {
  const { data, error } = response;
  if (error || !data || (typeof data === "object" && "error" in data)) {
    throw new Error((await functionError(error, data)).message);
  }
  return data;
}

export async function submitRequest(request: unknown): Promise<DecisionResult> {
  if (!request || typeof request !== "object" || Array.isArray(request))
    throw new Error("Request JSON must be an object.");
  const data = await requireData<DecisionResult>(
    await supabase.functions.invoke("requests", {
      headers: hdabHeaders(),
      body: request as Record<string, unknown>,
    }),
  );
  return mapEdgeResponse(data);
}

export async function listRequests(): Promise<RequestHistory> {
  return requireData<RequestHistory>(
    await supabase.functions.invoke("requests", { headers: hdabHeaders(), method: "GET" }),
  );
}

export async function getRequest(id: string): Promise<DecisionResult> {
  const data = await requireData<DecisionResult>(
    await supabase.functions.invoke(`requests?id=${encodeURIComponent(id)}`, {
      headers: hdabHeaders(),
      method: "GET",
    }),
  );
  return mapEdgeResponse(data);
}

export async function reviewRequest(body: StaffReviewBody): Promise<DecisionResult> {
  const data = await requireData<DecisionResult>(
    await supabase.functions.invoke("requests/review", { headers: hdabHeaders(), body }),
  );
  return mapEdgeResponse(data);
}

export async function downloadRequest(id: string): Promise<{ status: number; message: string }> {
  const { data, error } = await supabase.functions.invoke("spe-download", { body: { id } });
  const failure = await functionError(error, data);
  if (failure.status === 403) return { status: 403, message: failure.message };
  // Never treat a success payload as downloadable records.
  throw new Error(
    error
      ? failure.message
      : "Download blocked: the backend did not return the required 403 refusal.",
  );
}

export async function previewRequest(request: unknown): Promise<PreviewResult> {
  if (!request || typeof request !== "object" || Array.isArray(request))
    throw new Error("Preview body must be an object.");
  const data = await requireData<PreviewResult>(
    await supabase.functions.invoke("requests/preview", {
      headers: hdabHeaders(),
      body: request as Record<string, unknown>,
    }),
  );
  return data;
}

export interface PublicHdabConfig {
  code: string;
  country: string;
  name: string;
  display_language: "de" | "en";
  languages: ("de" | "en")[];
  contact: string;
  branding: { primary: string; accent: string };
}

export async function listHdabs(): Promise<PublicHdabConfig[]> {
  const data = await requireData<{ configs: PublicHdabConfig[] }>(
    await supabase.functions.invoke("requests/hdab", { method: "GET" }),
  );
  if (!Array.isArray(data.configs) || !data.configs.length)
    throw new Error("No access bodies available.");
  return data.configs;
}
