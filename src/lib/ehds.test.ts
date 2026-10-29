import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import {
  downloadRequest,
  listRequests,
  getRequest,
  mapEdgeResponse,
  SAMPLE_ENTRIES,
  submitRequest,
  type DecisionResult,
} from "./ehds";
const invoke = vi.mocked(supabase.functions.invoke);
const statistical: DecisionResult = {
  request_id: "R01",
  decision: "APPROVE_STATISTICAL",
  articles: ["53", "Art. 69"],
  reason: "Allowed",
  answer: { Wien: { adults: 30, prevalence_pct: 10 } },
};
const httpError = (status: number, message: string) => ({
  data: null,
  error: {
    message: "Function error",
    context: new Response(JSON.stringify({ error: message, request_id: "R05" }), { status }),
  },
});
beforeEach(() => vi.resetAllMocks());
describe("Track 3 requests", () => {
  it("offers exactly R01–R10 with R01 first and the real request format", () => {
    expect(SAMPLE_ENTRIES.map((s) => s.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `R${String(i + 1).padStart(2, "0")}`),
    );
    expect(SAMPLE_ENTRIES[0]!.request.applicant.name).toBe("Dr. Sophie Lechner");
    expect(
      SAMPLE_ENTRIES.every(
        (s) => s.label.startsWith(`${s.id} — `) && s.request.definitions.length > 0,
      ),
    ).toBe(true);
  });
});
describe("responses and submission", () => {
  it("preserves grouped answers and normalises articles", () => {
    expect(mapEdgeResponse(statistical)).toEqual({
      ...statistical,
      articles: ["Art. 53", "Art. 69"],
    });
  });
  it("preserves null rejections, SPE cohort, schema and review flag", () => {
    expect(mapEdgeResponse({ ...statistical, decision: "REJECT", answer: null }).answer).toBeNull();
    const spe = {
      ...statistical,
      decision: "APPROVE_SPE" as const,
      answer: { cohort_size: 22 },
      spe_schema: "spe_r05",
      needs_review: true,
    };
    expect(mapEdgeResponse(spe)).toMatchObject({ ...spe, articles: ["Art. 53", "Art. 69"] });
  });
  it("returns only the live response for a sample or minimal custom request", async () => {
    invoke.mockResolvedValue({ data: statistical, error: null });
    const request = SAMPLE_ENTRIES[0]!.request;
    expect(await submitRequest(request)).toEqual(mapEdgeResponse(statistical));
    expect(invoke).toHaveBeenCalledWith("requests", { body: request });
    const custom = { id: "custom", requested_as: "health data request", purpose: "Research" };
    await submitRequest(custom);
    expect(invoke).toHaveBeenLastCalledWith("requests", { body: custom });
  });
  it.each([400, 401, 403, 500, 501])(
    "surfaces HTTP %i without fabricated results",
    async (status) => {
      invoke.mockResolvedValue(httpError(status, "Backend failure"));
      await expect(submitRequest(SAMPLE_ENTRIES[0]!.request)).rejects.toThrow("Backend failure");
    },
  );
  it("surfaces transport errors", async () => {
    invoke.mockRejectedValue(new Error("Offline"));
    await expect(submitRequest(SAMPLE_ENTRIES[0]!.request)).rejects.toThrow("Offline");
  });
  it("surfaces function-level errors and missing responses", async () => {
    invoke.mockResolvedValue({ data: { error: "Invalid request" }, error: null });
    await expect(submitRequest({})).rejects.toThrow("Invalid request");
    invoke.mockResolvedValue({ data: null, error: null });
    await expect(submitRequest({})).rejects.toThrow("invalid response");
  });
});
describe("secure downloads", () => {
  it("calls spe-download and extracts the actual 403 JSON message", async () => {
    invoke.mockResolvedValue(
      httpError(403, "Download is not permitted. This attempt has been logged."),
    );
    expect(await downloadRequest("R05")).toEqual({
      status: 403,
      message: "Download is not permitted. This attempt has been logged.",
    });
    expect(invoke).toHaveBeenCalledWith("spe-download", { body: { id: "R05" } });
  });
  it("does not expose unexpected successful data", async () => {
    invoke.mockResolvedValue({ data: { records: ["must never be shown"] }, error: null });
    await expect(downloadRequest("R05")).rejects.toThrow("required 403 refusal");
  });
  it("surfaces server, network and malformed response errors", async () => {
    invoke.mockResolvedValue(httpError(500, "Unavailable"));
    await expect(downloadRequest("R05")).rejects.toThrow("Unavailable");
    invoke.mockRejectedValue(new Error("Offline"));
    await expect(downloadRequest("R05")).rejects.toThrow("Offline");
    invoke.mockResolvedValue({
      data: null,
      error: { message: "Forbidden", context: new Response("", { status: 403 }) },
    });
    expect(await downloadRequest("R05")).toEqual({ status: 403, message: "Forbidden" });
  });
});

describe("live staff history", () => {
  it("fetches overview including duplicates and download attempts without using local submissions", async () => {
    const row = {
      request_id: "R05",
      submitted_at: "2026-10-29T18:30:00Z",
      decision: "APPROVE_SPE",
      articles: ["53"],
      needs_review: false,
      spe_schema: "spe_r05",
    };
    const history = {
      requests: [row, row],
      downloads: [{ request_id: "R05", attempted_at: "2026-10-29T18:31:00Z" }],
    };
    invoke.mockResolvedValue({ data: history, error: null });
    expect(await listRequests()).toEqual(history);
    expect(invoke).toHaveBeenCalledWith("requests", { method: "GET" });
  });
  it("fetches an encoded id and preserves saved cohort and review information", async () => {
    const saved = {
      ...statistical,
      decision: "APPROVE_SPE" as const,
      answer: { cohort_size: 12 },
      spe_schema: "spe_r05",
      needs_review: true,
      parse_errors: [{ definition: "Unknown", reason: "Unsupported" }],
    };
    invoke.mockResolvedValue({ data: saved, error: null });
    expect(await getRequest("R 05/?#&")).toEqual(mapEdgeResponse(saved));
    expect(invoke).toHaveBeenCalledWith("requests?id=R%2005%2F%3F%23%26", { method: "GET" });
  });
  it("surfaces history and saved-result failures", async () => {
    invoke.mockResolvedValue(httpError(500, "internal server error"));
    await expect(listRequests()).rejects.toThrow("internal server error");
    invoke.mockResolvedValue(httpError(404, "request not found"));
    await expect(getRequest("missing")).rejects.toThrow("request not found");
  });
  it("accepts empty live history", async () => {
    invoke.mockResolvedValue({ data: { requests: [], downloads: [] }, error: null });
    expect(await listRequests()).toEqual({ requests: [], downloads: [] });
  });
});
