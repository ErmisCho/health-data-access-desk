import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Supabase client before importing ehds so the module-level import resolves to the mock.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";
import {
  decide,
  downloadRequest,
  mapEdgeResponse,
  R07_REQUEST,
  SAMPLE_ENTRIES,
  SAMPLES,
  submitRequest,
} from "./ehds";

const invokeMock = supabase.functions.invoke as ReturnType<typeof vi.fn>;

const s = (id: string) => SAMPLES.find((r) => r.id === id)!;

// ─── existing decision tests ────────────────────────────────────────────────
describe("EHDS decisions", () => {
  it("rejects prohibited purposes under Art. 54", () => {
    const r = decide(s("REQ-002"));
    expect(r.decision).toBe("REJECT");
    expect(r.articles).toContain("Art. 54");
  });
  it("approves aggregated research as statistical", () => {
    expect(decide(s("REQ-001")).decision).toBe("APPROVE_STATISTICAL");
  });
  it("routes individual-level data to the SPE", () => {
    expect(decide(s("REQ-003")).decision).toBe("APPROVE_SPE");
  });
  it("rejects aggregated output with cell size below 10", () => {
    expect(decide(s("REQ-007")).decision).toBe("REJECT");
  });
  it("blocks downloads with 403", async () => {
    expect((await downloadRequest("REQ-001")).status).toBe(403);
  });
});

// ─── mapEdgeResponse ─────────────────────────────────────────────────────────
describe("mapEdgeResponse", () => {
  const R07_EDGE_PAYLOAD = {
    request_id: "R07",
    decision: "APPROVE_STATISTICAL" as const,
    articles: ["53", "69"],
    reason: "Official statistics are an allowed purpose (Art. 53). Statistics answer the question (Art. 69).",
    answer: {
      Burgenland: 28,
      Kärnten: 69,
      Niederösterreich: 187,
      Oberösterreich: 194,
      Salzburg: 69,
      Steiermark: 140,
      Tirol: 86,
      Vorarlberg: 61,
      Wien: 245,
    },
  };

  it("maps decision correctly", () => {
    expect(mapEdgeResponse(R07_EDGE_PAYLOAD).decision).toBe("APPROVE_STATISTICAL");
  });

  it("prefixes bare article numbers with 'Art. '", () => {
    const result = mapEdgeResponse(R07_EDGE_PAYLOAD);
    expect(result.articles).toContain("Art. 53");
    expect(result.articles).toContain("Art. 69");
  });

  it("does not double-prefix articles that already start with 'Art.'", () => {
    const data = { ...R07_EDGE_PAYLOAD, articles: ["Art. 53", "Art. 69"] };
    const result = mapEdgeResponse(data);
    expect(result.articles).toEqual(["Art. 53", "Art. 69"]);
  });

  it("maps answer object into results rows", () => {
    const result = mapEdgeResponse(R07_EDGE_PAYLOAD);
    expect(result.results).toHaveLength(9);
    expect(result.results.find((r) => r.label === "Wien")).toEqual({ label: "Wien", value: "245" });
    expect(result.results.find((r) => r.label === "Burgenland")).toEqual({ label: "Burgenland", value: "28" });
  });

  it("maps string counts (e.g. '<10') as-is", () => {
    const data = { ...R07_EDGE_PAYLOAD, answer: { Region: "<10" } };
    expect(mapEdgeResponse(data).results[0].value).toBe("<10");
  });

  it("sets cohort_size to 0 and spe_status to not_required", () => {
    const result = mapEdgeResponse(R07_EDGE_PAYLOAD);
    expect(result.cohort_size).toBe(0);
    expect(result.spe_status).toBe("not_required");
  });

  it("does not set mock flag", () => {
    expect(mapEdgeResponse(R07_EDGE_PAYLOAD).mock).toBeUndefined();
  });
});

// ─── submitRequest ────────────────────────────────────────────────────────────
describe("submitRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns live data when edge function succeeds", async () => {
    invokeMock.mockResolvedValue({
      data: {
        request_id: "R07",
        decision: "APPROVE_STATISTICAL",
        articles: ["53", "69"],
        reason: "test reason",
        answer: { Wien: 245 },
      },
      error: null,
    });
    const result = await submitRequest(R07_REQUEST);
    expect(result.decision).toBe("APPROVE_STATISTICAL");
    expect(result.mock).toBeUndefined();
    expect(result.results).toEqual([{ label: "Wien", value: "245" }]);
  });

  it("falls back to mock when edge function returns an error field (501)", async () => {
    invokeMock.mockResolvedValue({
      data: { error: "not supported yet" },
      error: null,
    });
    const result = await submitRequest(s("REQ-001"));
    expect(result.mock).toBe(true);
    expect(result.decision).toBe("APPROVE_STATISTICAL"); // REQ-001 is aggregated research
  });

  it("falls back to mock when edge function returns a Supabase error", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: "Function error" },
    });
    const result = await submitRequest(s("REQ-002"));
    expect(result.mock).toBe(true);
    expect(result.decision).toBe("REJECT");
  });

  it("falls back to mock on network exception", async () => {
    invokeMock.mockRejectedValue(new Error("Network failure"));
    const result = await submitRequest(s("REQ-003"));
    expect(result.mock).toBe(true);
    expect(result.decision).toBe("APPROVE_SPE");
  });
});

// ─── SAMPLE_ENTRIES ───────────────────────────────────────────────────────────
describe("SAMPLE_ENTRIES", () => {
  it("has R07 as the first entry", () => {
    expect(SAMPLE_ENTRIES[0].id).toBe("R07");
  });

  it("labels R07 with 'live data'", () => {
    expect(SAMPLE_ENTRIES[0].label).toContain("live data");
  });

  it("contains all legacy samples after R07", () => {
    const ids = SAMPLE_ENTRIES.slice(1).map((e) => e.id);
    expect(ids).toEqual(SAMPLES.map((s) => s.id));
  });

  it("R07 entry request matches R07_REQUEST", () => {
    expect(SAMPLE_ENTRIES[0].request).toBe(R07_REQUEST);
  });
});
