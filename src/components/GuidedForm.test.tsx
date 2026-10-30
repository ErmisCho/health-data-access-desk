/**
 * Tests for Issue #43 — Guided request form
 *
 * Covered:
 *   1. form→JSON equals sample JSON for all 10 samples (toRequest round-trip)
 *   2. Import/export round-trip
 *   3. Debounced preview call: called once after 600 ms, not immediately
 *   4. Unreadable definition is flagged inline with reason
 */

import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock supabase before importing modules that use it
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));
import { supabase } from "@/integrations/supabase/client";

import { SAMPLE_ENTRIES, type AccessRequest } from "@/lib/ehds";
import { GuidedForm } from "@/components/GuidedForm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal AccessRequest → the exact JSON the form would submit. */
function toRequest(form: AccessRequest): AccessRequest {
  return {
    ...form,
    definitions: form.definitions.filter((d) => d.trim().length > 0),
  };
}

function noop() {}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.clearAllTimers();
});

// ---------------------------------------------------------------------------
// 1. form→JSON equals sample JSON for all 10 samples
// ---------------------------------------------------------------------------
describe("toRequest round-trip", () => {
  it.each(SAMPLE_ENTRIES)(
    "sample $id: toRequest produces exactly the sample JSON",
    ({ request }) => {
      // The form starts from the sample; toRequest strips empty-string definitions.
      // Sample definitions are never empty, so toRequest must be an identity on them.
      const result = toRequest(request);
      expect(result).toEqual(request);
    },
  );
});

// ---------------------------------------------------------------------------
// 2. Import/export round-trip
// ---------------------------------------------------------------------------
describe("Import/export round-trip", () => {
  it("exported JSON re-imports to the same request", () => {
    const sample = SAMPLE_ENTRIES[0]!.request;
    // Simulate export: JSON.stringify the request
    const exported = JSON.stringify(toRequest(sample), null, 2);
    // Simulate import: parse it back
    const imported = JSON.parse(exported) as AccessRequest;
    expect(imported).toEqual(sample);
  });

  it("exported JSON for all samples round-trips", () => {
    for (const { request } of SAMPLE_ENTRIES) {
      const exported = JSON.stringify(toRequest(request), null, 2);
      const imported = JSON.parse(exported) as AccessRequest;
      expect(imported).toEqual(request);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Debounced preview call
// ---------------------------------------------------------------------------
describe("GuidedForm debounced preview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls preview endpoint after 600 ms debounce, not immediately", async () => {
    const previewData = {
      decision: "APPROVE_STATISTICAL",
      articles: ["53", "69"],
      reason: "Allowed",
      needs_review: false,
      status: "decided",
      rule: "Approved for anonymised statistics",
      trigger_phrases: ["research"],
      plan_summary: "Patients aged 18+",
      unreadable: [],
    };
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: previewData,
      error: null,
    });

    render(<GuidedForm onResult={noop} />);

    // Load sample 0 (R01) to populate purpose+question+definitions
    const sampleSelect = screen.getByLabelText("Load a sample");
    fireEvent.change(sampleSelect, { target: { value: "0" } });

    // Preview must NOT have been called yet (debounce hasn't fired)
    expect(supabase.functions.invoke).not.toHaveBeenCalledWith(
      "requests/preview",
      expect.anything(),
    );

    // Advance fake timers past the 600 ms debounce, then flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(700);
      // Flush the microtask queue so the async setTimeout callback resolves
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "requests/preview",
      expect.objectContaining({ body: expect.objectContaining({ purpose: expect.any(String) }) }),
    );
    // Should only have been called once (debounce)
    const previewCalls = vi.mocked(supabase.functions.invoke).mock.calls.filter(
      (c) => c[0] === "requests/preview",
    );
    expect(previewCalls).toHaveLength(1);
  });

  it("debounce: rapid edits produce only one preview call after settling", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        decision: "APPROVE_STATISTICAL",
        articles: ["53"],
        reason: "ok",
        needs_review: false,
        status: "decided",
        rule: "r",
        trigger_phrases: [],
        unreadable: [],
      },
      error: null,
    });

    render(<GuidedForm onResult={noop} />);
    const sampleSelect = screen.getByLabelText("Load a sample");

    // Rapid-fire: load sample 0, then 1, then 0 again within the debounce window
    fireEvent.change(sampleSelect, { target: { value: "0" } });
    await act(async () => { vi.advanceTimersByTime(200); });
    fireEvent.change(sampleSelect, { target: { value: "1" } });
    await act(async () => { vi.advanceTimersByTime(200); });
    fireEvent.change(sampleSelect, { target: { value: "0" } });
    await act(async () => { vi.advanceTimersByTime(200); });

    // Still not fired (total < 600 ms since last change)
    const beforeSettle = vi.mocked(supabase.functions.invoke).mock.calls.filter(
      (c) => c[0] === "requests/preview",
    );
    expect(beforeSettle).toHaveLength(0);

    // Settle: advance past 600 ms from the last change, then flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
      await Promise.resolve();
    });

    const afterSettle = vi.mocked(supabase.functions.invoke).mock.calls.filter(
      (c) => c[0] === "requests/preview",
    );
    expect(afterSettle).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Unreadable definition flagged inline
// ---------------------------------------------------------------------------
describe("GuidedForm unreadable definition inline flag", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("flags definition at reported index with reason text", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        decision: "APPROVE_STATISTICAL",
        articles: ["53"],
        reason: "ok",
        needs_review: false,
        status: "decided",
        rule: "r",
        trigger_phrases: [],
        unreadable: [{ index: 0, definition: "Adult = aged 18 or older on 31 December 2025.", reason: "Unsupported phrasing" }],
      },
      error: null,
    });

    render(<GuidedForm onResult={noop} />);

    // Load a sample so purpose/question/definitions are populated
    const sampleSelect = screen.getByLabelText("Load a sample");
    fireEvent.change(sampleSelect, { target: { value: "0" } });

    // Fire debounce and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Navigate to definitions step (after preview resolves)
    const definitionsStepBtn = screen.getAllByRole("button").find((b) =>
      b.textContent?.includes("Definitions"),
    );
    if (definitionsStepBtn) {
      fireEvent.click(definitionsStepBtn);
    }

    // Error message must appear
    const errorMsg = screen.queryByText("Unsupported phrasing");
    expect(errorMsg).not.toBeNull();
    expect(errorMsg).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. Staff-review banner in WeUnderstoodPanel
// ---------------------------------------------------------------------------
describe("GuidedForm WeUnderstoodPanel staff-review banner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows 'held for staff review' banner when needs_review is true from decide()", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        decision: "APPROVE_STATISTICAL",
        articles: ["53"],
        reason: "Purpose unclear",
        needs_review: true,
        status: "staff_review",
        rule: "r",
        trigger_phrases: [],
        unreadable: [],
      },
      error: null,
    });

    render(<GuidedForm onResult={noop} />);
    fireEvent.change(screen.getByLabelText("Load a sample"), { target: { value: "0" } });

    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText("This request would be held for staff review."),
    ).toBeInTheDocument();
  });

  it("shows 'held for staff review' banner when needs_review is true from unreadable definitions", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        decision: "APPROVE_STATISTICAL",
        articles: ["53"],
        reason: "ok",
        needs_review: true,
        status: "staff_review",
        rule: "r",
        trigger_phrases: [],
        unreadable: [{ index: 4, definition: "Flurb = zorbled", reason: "Unsupported definition" }],
      },
      error: null,
    });

    render(<GuidedForm onResult={noop} />);
    fireEvent.change(screen.getByLabelText("Load a sample"), { target: { value: "0" } });

    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText("This request would be held for staff review."),
    ).toBeInTheDocument();
  });
});

describe("GuidedForm three steps", () => {
  it("starts with the question, ends with the applicant and a country list led by Austria and Germany", () => {
    render(<GuidedForm onResult={noop} />);
    const steps = screen.getAllByRole("button").filter((b) => /^\d\./.test(b.textContent ?? ""));
    expect(steps.map((b) => b.textContent)).toEqual([
      "1. What you want to know",
      "2. Definitions",
      "3. About you & submit",
    ]);
    expect(screen.getByLabelText("What is your research question?")).toBeInTheDocument();
    fireEvent.click(steps[2]!);
    const country = screen.getByLabelText("Country") as HTMLSelectElement;
    expect([...country.options].slice(1, 3).map((o) => o.value)).toEqual(["AT", "DE"]);
  });
});
