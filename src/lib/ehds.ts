import { supabase } from "@/integrations/supabase/client";
export { SAMPLE_ENTRIES, type AccessRequest } from "./requests";

export type Decision = "REJECT" | "APPROVE_STATISTICAL" | "APPROVE_SPE";
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
export interface DecisionResult {
  request_id: string;
  decision: Decision;
  articles: string[];
  reason: string;
  answer: Answer | null;
  needs_review?: boolean;
  spe_schema?: string;
  parse_errors?: { definition: string; reason: string }[];
  explanation?: DecisionExplanation;
  population?: { eligible_patients: number };
}
export interface RequestSummary {
  request_id: string;
  submitted_at: string;
  decision: Decision;
  articles: string[];
  needs_review: boolean;
  spe_schema: string | null;
}
export interface RequestHistory {
  requests: RequestSummary[];
  downloads: { request_id: string; attempted_at: string }[];
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
    await supabase.functions.invoke("requests", { body: request as Record<string, unknown> }),
  );
  return mapEdgeResponse(data);
}

export async function listRequests(): Promise<RequestHistory> {
  return requireData<RequestHistory>(
    await supabase.functions.invoke("requests", { method: "GET" }),
  );
}

export async function getRequest(id: string): Promise<DecisionResult> {
  const data = await requireData<DecisionResult>(
    await supabase.functions.invoke(`requests?id=${encodeURIComponent(id)}`, { method: "GET" }),
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
