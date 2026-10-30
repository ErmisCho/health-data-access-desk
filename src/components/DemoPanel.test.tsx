import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_ENTRIES, type DecisionResult } from "@/lib/ehds";
import { DemoPanel } from "./DemoPanel";

const invoke = vi.mocked(supabase.functions.invoke);
const base: DecisionResult = {
  request_id: "R01",
  decision: "APPROVE_STATISTICAL",
  articles: ["53", "69"],
  reason: "Live backend reason",
  answer: { Wien: { adults: 3247, type2_diabetes: 263, prevalence_pct: 8.1 } },
  population: { eligible_patients: 19161 },
};
const spe: DecisionResult = {
  ...base,
  request_id: "R05",
  decision: "APPROVE_SPE",
  articles: ["53", "66", "68", "73"],
  answer: { cohort_size: 1152 },
  spe_schema: "spe_r05",
};
const blockedMessage =
  "Download blocked: data in a secure processing environment cannot be downloaded (EHDS Art. 73).";
function blocked(status = 403) {
  return {
    data: null,
    error: {
      message: "Function error",
      context: new Response(JSON.stringify({ error: blockedMessage }), { status }),
    },
  };
}
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it.each(SAMPLE_ENTRIES)("shows the explanation for sample $id in Demo", async ({ id, request }) => {
  const phrase = request.purpose.split(" ").slice(0, 3).join(" ");
  invoke.mockResolvedValue({
    data: {
      ...base,
      request_id: id,
      explanation: {
        rule: "Matched purpose",
        trigger_phrases: [phrase],
        articles: [],
        plan_summary: "Count eligible patients per region.",
      },
    },
    error: null,
  });
  render(<DemoPanel />);
  fireEvent.change(screen.getByLabelText("Any sample request"), { target: { value: id } });
  fireEvent.click(screen.getByRole("button", { name: "Run sample request" }));
  const panel = await screen.findByRole("region", { name: "Decision explanation" });
  expect(within(panel).getByText("Request purpose").nextElementSibling?.textContent).toBe(
    request.purpose,
  );
  expect(panel.querySelector("mark")?.textContent).toBe(phrase);
  expect(within(panel).getByText("Count eligible patients per region.")).toBeInTheDocument();
  expect(invoke).toHaveBeenCalledWith("requests", { headers: { "x-hdab": "at" }, body: request });
});

const cases = [
  {
    label: "Art. 54 rejection",
    id: "R02",
    result: { ...base, request_id: "R02", decision: "REJECT", articles: ["54"], answer: null },
    facts: ["null (no numerical answer)"],
  },
  { label: "Statistics with numbers", id: "R01", result: base, facts: ["263", "3247", "8.1"] },
  {
    label: "Opted-out patients excluded",
    id: "R01",
    result: base,
    facts: ["Eligible patients: 19161", "3247"],
  },
  {
    label: "Small-cell suppression",
    id: "R08",
    result: {
      ...base,
      request_id: "R08",
      answer: {
        Burgenland: { women_with_bmi: "<10", mean_bmi: "suppressed" },
        Niederösterreich: { women_with_bmi: 15, mean_bmi: 27.2 },
      },
    },
    facts: ["Burgenland", "<10", "suppressed", "Niederösterreich", "15", "27.2"],
  },
  { label: "Secure environment", id: "R05", result: spe, facts: ["Cohort size: 1152", "spe_r05"] },
  { label: "Blocked download", id: "R05", result: spe, facts: ["HTTP 403", blockedMessage] },
  {
    label: "Records downgraded to statistics",
    id: "R09",
    result: {
      ...base,
      request_id: "R09",
      articles: ["53", "66", "69"],
      answer: {
        "18-49": { adults_with_hypertension: 359, ace_inhibitor_pct: 39.6, arb_pct: 33.4 },
      },
    },
    facts: [
      "Requested pseudonymised records → returned APPROVE_STATISTICAL",
      "359",
      "39.6",
      "33.4",
    ],
  },
] satisfies { label: string; id: string; result: DecisionResult; facts: string[] }[];

it("offers the seven scenarios in presentation order without fetching on mount", () => {
  render(<DemoPanel />);
  expect(
    screen.getAllByRole("button", { name: /^\d\./ }).map((button) => button.textContent),
  ).toEqual(cases.map((scenario, index) => `${index + 1}. ${scenario.label} · ${scenario.id}`));
  expect(invoke).not.toHaveBeenCalled();
  const proof = screen.getByRole("region", { name: "Proof" });
  expect(proof).toHaveTextContent(
    "Measured 30 Oct 2026 against the live backend: 10/10 sample decisions · 6/6 numbers · 0 leaks · consistent over 3 runs · 42 jury requests, 0 wrong decisions, 0 leaks, 13 prohibited purposes rejected",
  );
  expect(proof).toHaveTextContent("Test requests, not real applications.");
});

it.each(cases)(
  "$label renders the response proof on three consecutive clicks",
  async ({ label, id, result, facts }) => {
    invoke.mockImplementation(async (name) =>
      name === "spe-download" ? blocked() : { data: result, error: null },
    );
    render(<DemoPanel />);
    const button = screen.getByRole("button", { name: new RegExp(label) });
    for (let run = 1; run <= 3; run++) {
      fireEvent.click(button);
      const callout = await screen.findByRole("complementary", { name: "What to point at" });
      for (const fact of facts) expect(callout).toHaveTextContent(fact);
      const liveEl = screen.getByRole("region", { name: "Live demo result" });
      const live = within(liveEl);
      // badge now shows plain label with raw code in parentheses (aria-hidden)
      expect(liveEl.textContent).toContain(result.decision);
      for (const article of result.articles)
        expect(live.getByText(`Art. ${article}`)).toBeInTheDocument();
      expect(invoke).toHaveBeenCalledWith("requests", {
        headers: { "x-hdab": "at" },
        body: SAMPLE_ENTRIES.find((entry) => entry.id === id)!.request,
      });
      expect(invoke.mock.calls.filter(([name]) => name === "requests")).toHaveLength(run);
      if (label === "Blocked download") {
        expect(invoke).toHaveBeenLastCalledWith("spe-download", { body: { id: "R05" } });
        expect(invoke.mock.calls.filter(([name]) => name === "spe-download")).toHaveLength(run);
      }
    }
  },
);

it("uses changed response numbers and schema rather than benchmark constants", async () => {
  render(<DemoPanel />);
  for (const scenario of cases.filter(({ id }) => id !== "R02")) {
    invoke.mockImplementation(async (name) =>
      name === "spe-download"
        ? blocked()
        : {
            data: {
              ...scenario.result,
              population: { eligible_patients: 12345 },
              spe_schema: "live_schema",
              answer: {
                cohort_size: 987,
                Wien: { adults: 987, type2_diabetes: 987, prevalence_pct: 987 },
                Burgenland: { women_with_bmi: 987, mean_bmi: 987 },
                Niederösterreich: { women_with_bmi: 987, mean_bmi: 987 },
                "18-49": { adults_with_hypertension: 987, ace_inhibitor_pct: 987, arb_pct: 987 },
              },
            },
            error: null,
          },
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(scenario.label) }));
    const callout = await screen.findByRole("complementary", { name: "What to point at" });
    expect(callout).toHaveTextContent(scenario.label === "Blocked download" ? "HTTP 403" : "987");
    if (scenario.label === "Opted-out patients excluded")
      expect(callout).toHaveTextContent("12345");
    if (scenario.label === "Secure environment") expect(callout).toHaveTextContent("live_schema");
  }
});

it("shows missing population honestly and clears the previous result on failure, allowing retry", async () => {
  invoke.mockResolvedValue({ data: { ...base, population: undefined }, error: null });
  render(<DemoPanel />);
  const button = screen.getByRole("button", { name: /Opted-out patients excluded/ });
  fireEvent.click(button);
  expect(await screen.findByRole("complementary")).toHaveTextContent("Not provided by the backend");
  invoke.mockRejectedValueOnce(new Error("Offline"));
  fireEvent.click(button);
  expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  fireEvent.click(button);
  await screen.findByRole("complementary");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("disables all scenarios while pending to prevent overlapping results", async () => {
  let resolve!: (value: { data: DecisionResult; error: null }) => void;
  invoke.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<DemoPanel />);
  fireEvent.click(screen.getByRole("button", { name: /Statistics with numbers/ }));
  for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  resolve({ data: base, error: null });
  await waitFor(() => expect(screen.getAllByRole("button")[0]).toBeEnabled());
});

it.each([500, 200])(
  "never labels a non-403 download response (%i) as a blocked-download proof",
  async (status) => {
    invoke.mockResolvedValueOnce({ data: spe, error: null });
    invoke.mockResolvedValueOnce(
      status === 200 ? { data: { records: ["private record"] }, error: null } : blocked(status),
    );
    render(<DemoPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Blocked download/ }));
    await screen.findByRole("alert");
    expect(screen.getByRole("complementary")).toHaveTextContent("Download refusal not confirmed");
    expect(screen.queryByText(/HTTP 403/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private record/)).not.toBeInTheDocument();
  },
);

it("does not attempt a download if R05 is not approved for the SPE", async () => {
  invoke.mockResolvedValue({ data: { ...spe, decision: "REJECT", answer: null }, error: null });
  render(<DemoPanel />);
  fireEvent.click(screen.getByRole("button", { name: /Blocked download/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Download was not attempted");
  expect(invoke).toHaveBeenCalledTimes(1);
});
