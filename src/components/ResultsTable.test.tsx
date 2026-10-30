import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import { LangProvider } from "@/lib/i18n";
import { ResultsTable } from "./ResultsTable";
import { DecisionDetails } from "./DecisionDetails";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.removeItem("ehds-lang");
});
it("Yes/No toggle hides and restores percentage headers and cells", () => {
  render(<ResultsTable answer={{ Wien: { count: 30, prevalence_pct: 8.1 } }} />);
  expect(screen.getByRole("columnheader", { name: "Prevalence (%)" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Show percentage columns"), { target: { value: "no" } });
  expect(screen.queryByRole("columnheader", { name: "Prevalence (%)" })).not.toBeInTheDocument();
  expect(screen.queryByText("8.1 %")).not.toBeInTheDocument();
  expect(screen.getByText("30")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Show percentage columns"), { target: { value: "yes" } });
  expect(screen.getByText("8.1 %")).toBeInTheDocument();
});
it("staff see schema and the real download refusal; applicants see cohort and review", async () => {
  const result = {
    request_id: "R05",
    decision: "APPROVE_SPE" as const,
    articles: ["Art. 53"],
    reason: "Allowed",
    answer: { cohort_size: 22 },
    spe_schema: "spe_r05",
    needs_review: true,
  };
  const { rerender } = render(<DecisionDetails result={result} />);
  expect(screen.getByText("22")).toBeInTheDocument();
  expect(screen.getByText("Needs staff review")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
  rerender(<DecisionDetails result={result} staff />);
  expect(screen.getByText(/Schema: spe_r05.*downloads blocked/)).toBeInTheDocument();
  vi.mocked(supabase.functions.invoke).mockResolvedValue({
    data: null,
    error: {
      message: "Function error",
      context: new Response(
        JSON.stringify({ error: "Download is not permitted. This attempt has been logged." }),
        { status: 403 },
      ),
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Download is not permitted. This attempt has been logged.",
    ),
  );
});
it("rejections show the decision and reason without results", () => {
  render(
    <DecisionDetails
      result={{
        request_id: "R02",
        decision: "REJECT",
        articles: ["Art. 54"],
        reason: "Prohibited",
        answer: null,
      }}
    />,
  );
  expect(screen.getByText("REJECT")).toBeInTheDocument();
  expect(screen.getByText("Prohibited")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByText(/Cohort size/)).not.toBeInTheDocument();
});

it.each(["en", "de"])("renders readable R01/R03/R09 headings and preserves suppression in %s", (lang) => {
  sessionStorage.setItem("ehds-lang", lang);
  render(<LangProvider><ResultsTable answer={{ Wien: {
    adults: 30, type2_diabetes: "<10", prevalence_pct: "suppressed",
    af_patients: 20, without_oac: "<10", share_without_oac_pct: "suppressed",
    adults_with_hypertension: 25, ace_inhibitor_pct: 12, arb_pct: 4,
  } }} /></LangProvider>);
  const expected = lang === "de"
    ? ["Erwachsene", "Erwachsene mit Typ-2-Diabetes", "Prävalenz (%)", "Personen mit Vorhofflimmern", "Personen ohne orale Antikoagulation", "Ohne orale Antikoagulation (%)", "Erwachsene mit Bluthochdruck", "ACE-Hemmer-Einnahme (%)", "Angiotensin-Rezeptorblocker-Einnahme (%)"]
    : ["Adults", "Adults with type 2 diabetes", "Prevalence (%)", "Patients with atrial fibrillation", "Patients without oral anticoagulation", "Without oral anticoagulation (%)", "Adults with hypertension", "ACE inhibitor use (%)", "Angiotensin receptor blocker use (%)"];
  for (const name of expected) expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
  expect(screen.getAllByText("<10")).toHaveLength(2);
  expect(screen.getAllByText("suppressed")).toHaveLength(2);
  expect(screen.getByText("30")).toBeInTheDocument();
});
