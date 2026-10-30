import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock("./SiteHeader", () => ({ SiteHeader: () => <header /> }));
import { supabase } from "@/integrations/supabase/client";
import { TransparencyRegister } from "./TransparencyRegister";
import { LangProvider } from "@/lib/i18n";

const invoke = vi.mocked(supabase.functions.invoke);
const entry = {
  reference: "HDAB-2026-000123",
  date: "2026-10-30",
  organisation_type: "Research institution",
  purpose_category: "Scientific research",
  decision: "APPROVE_STATISTICAL",
  articles: ["53", "69"],
};

afterEach(() => {
  cleanup();
  sessionStorage.removeItem("ehds-lang");
  document.documentElement.lang = "en";
  vi.resetAllMocks();
});

it("renders every backend organisation type in German", async () => {
  const organisationTypes = [
    ["Research institution", "Forschungseinrichtung"],
    ["Healthcare provider", "Gesundheitsdienstleister"],
    ["Public body", "Öffentliche Stelle"],
    ["Insurer", "Versicherer"],
    ["Company", "Unternehmen"],
    ["Other", "Sonstige"],
  ];
  invoke.mockResolvedValue({
    data: {
      entries: organisationTypes.map(([organisation_type], index) => ({
        ...entry,
        reference: `HDAB-2026-${index}`,
        organisation_type,
      })),
    },
    error: null,
  });
  sessionStorage.setItem("ehds-lang", "de");
  render(<LangProvider><TransparencyRegister /></LangProvider>);
  for (const [english, german] of organisationTypes) {
    expect(await screen.findByRole("cell", { name: german })).toBeVisible();
    expect(screen.queryByRole("cell", { name: english })).not.toBeInTheDocument();
  }
});

it("loads public entries with GET, renders their fields, and filters locally", async () => {
  invoke.mockResolvedValue({
    data: {
      entries: [
        entry,
        { ...entry, reference: "HDAB-2026-000122", decision: "REJECT", articles: ["54"] },
      ],
    },
    error: null,
  });
  render(<TransparencyRegister />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading decisions");
  await screen.findByText(entry.reference);
  expect(invoke).toHaveBeenCalledWith("register", { method: "GET" });
  expect(screen.getByRole("table")).toHaveAccessibleName(
    "Public decisions, newest submission first",
  );
  expect(screen.getAllByRole("columnheader")).toHaveLength(6);
  expect(screen.getAllByText("Research institution")).toHaveLength(2);
  expect(screen.getAllByText("Scientific research")).toHaveLength(2);
  expect(screen.getAllByText("2026-10-30")).toHaveLength(2);
  expect(screen.getByText("Art. 53, Art. 69")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Filter by decision"), { target: { value: "REJECT" } });
  expect(screen.queryByText(entry.reference)).not.toBeInTheDocument();
  expect(screen.getByText("HDAB-2026-000122")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("1 decision shown");
  fireEvent.change(screen.getByLabelText("Filter by decision"), {
    target: { value: "APPROVE_SPE" },
  });
  expect(screen.getByText("No decisions match this filter.")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Filter by decision"), { target: { value: "" } });
  expect(screen.getByRole("status")).toHaveTextContent("2 decisions shown");
  expect(invoke).toHaveBeenCalledTimes(1);
});

it("explains the privacy boundary and handles an empty register", async () => {
  invoke.mockResolvedValue({ data: { entries: [] }, error: null });
  render(<TransparencyRegister />);
  expect(await screen.findByText("No decided requests have been published yet.")).toBeVisible();
  expect(screen.getByText(/deliberately omit personal and organisation names/)).toHaveTextContent(
    "all patient data, answers and cohort sizes",
  );
});

it("handles a failure without exposing backend details and lets the reader retry", async () => {
  invoke.mockRejectedValueOnce(new Error("private backend detail"));
  invoke.mockResolvedValueOnce({ data: { entries: [entry] }, error: null });
  render(<TransparencyRegister />);
  expect(await screen.findByRole("alert")).toHaveTextContent("The register could not be loaded");
  expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText(entry.reference)).toBeVisible();
});
