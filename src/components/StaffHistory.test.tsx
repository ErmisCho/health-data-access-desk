import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import { StaffHistory } from "./StaffHistory";
const invoke = vi.mocked(supabase.functions.invoke);
const row = {
  request_id: "R05",
  submitted_at: "2026-10-29T18:30:00Z",
  decision: "APPROVE_SPE",
  articles: ["53"],
  needs_review: false,
  spe_schema: "spe_r05",
};
const saved = {
  request_id: "R05",
  decision: "APPROVE_SPE",
  articles: ["53"],
  reason: "Saved reason",
  needs_review: false,
  spe_schema: "spe_r05",
  answer: { cohort_size: 1152 },
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("loads live history, saved results and refreshed blocked-download attempts", async () => {
  let attempted = false;
  invoke.mockImplementation(async (name) => {
    if (name === "requests")
      return {
        data: {
          requests: [row, { ...row, submitted_at: "2026-10-29T18:29:00Z" }],
          downloads: attempted ? [{ request_id: "R05", attempted_at: "2026-10-29T18:31:00Z" }] : [],
        },
        error: null,
      };
    if (name === "requests?id=R05") return { data: saved, error: null };
    if (name === "spe-download") {
      attempted = true;
      return {
        data: null,
        error: {
          message: "Function error",
          context: new Response(JSON.stringify({ error: "Download blocked by EHDS Art. 73." }), {
            status: 403,
          }),
        },
      };
    }
    throw new Error("Unexpected API call");
  });
  render(<StaffHistory />);
  expect(await screen.findByText("1152")).toBeInTheDocument();
  expect(screen.getByText("Saved reason")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "View latest result for R05" })).toHaveLength(2);
  expect(screen.getByText("No blocked-download attempts recorded.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  expect(await screen.findByText("Download blocked by EHDS Art. 73.")).toBeInTheDocument();
  const log = await screen.findByRole("table", { name: "Blocked download attempts" });
  expect(within(log).getByText("2026-10-29T18:31:00Z")).toBeInTheDocument();
  expect(within(log).getByText("Blocked")).toBeInTheDocument();
  await waitFor(() =>
    expect(invoke.mock.calls.filter(([name]) => name === "requests")).toHaveLength(2),
  );
  expect(screen.getByText("Download blocked by EHDS Art. 73.")).toBeInTheDocument();
});
it("fetches selected IDs instead of presenting an overview as a full response", async () => {
  invoke.mockResolvedValueOnce({
    data: {
      requests: [
        row,
        { ...row, request_id: "R01", decision: "APPROVE_STATISTICAL", spe_schema: null },
      ],
      downloads: [],
    },
    error: null,
  });
  invoke.mockResolvedValueOnce({ data: saved, error: null });
  render(<StaffHistory />);
  await screen.findByText("1152");
  invoke.mockResolvedValueOnce({
    data: {
      ...saved,
      request_id: "R01",
      decision: "APPROVE_STATISTICAL",
      answer: { Wien: { cohort: 263, percentage: "8.1%" } },
    },
    error: null,
  });
  fireEvent.click(screen.getByRole("button", { name: "View latest result for R01" }));
  expect(await screen.findByText("263")).toBeInTheDocument();
  expect(invoke).toHaveBeenLastCalledWith("requests?id=R01", { method: "GET" });
  expect(screen.getByRole("columnheader", { name: "Percentage" })).toBeInTheDocument();
});
it("shows history errors and permits retry", async () => {
  invoke.mockRejectedValueOnce(new Error("Offline"));
  render(<StaffHistory />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load history: Offline");
  invoke.mockResolvedValueOnce({ data: { requests: [], downloads: [] }, error: null });
  fireEvent.click(screen.getByRole("button", { name: "Refresh history" }));
  expect(await screen.findByText("No saved requests.")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("shows saved-response failures while retaining overview and download log", async () => {
  invoke.mockResolvedValueOnce({
    data: { requests: [row], downloads: [{ request_id: "R05", attempted_at: "recent attempt" }] },
    error: null,
  });
  invoke.mockRejectedValueOnce(new Error("request not found"));
  render(<StaffHistory />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load saved result: request not found",
  );
  expect(screen.getByRole("table", { name: "Submission history" })).toBeInTheDocument();
  expect(screen.getByText("recent attempt")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
});
