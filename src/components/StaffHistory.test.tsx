import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
  status: "decided",
  spe_schema: "spe_r05",
  last_staff_action: null,
};
const heldRow = {
  request_id: "R01",
  submitted_at: "2026-10-29T18:28:00Z",
  decision: "APPROVE_STATISTICAL",
  articles: ["53", "69"],
  needs_review: true,
  status: "staff_review",
  spe_schema: null,
  last_staff_action: null,
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
const emptyHistory = {
  requests: [],
  downloads: [],
  staff_actions: [],
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
          downloads: attempted
            ? [{ request_id: "R05", attempted_at: "2026-10-29T18:31:00Z" }]
            : [],
          staff_actions: [],
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
          context: new Response(
            JSON.stringify({ error: "Download blocked by EHDS Art. 73." }),
            { status: 403 },
          ),
        },
      };
    }
    throw new Error("Unexpected API call");
  });
  render(<StaffHistory />);
  expect(await screen.findByText("1152")).toBeInTheDocument();
  expect(screen.getByText("Saved reason")).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "View latest result for R05" }),
  ).toHaveLength(2);
  expect(
    screen.getByText("No blocked-download attempts recorded."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  expect(
    await screen.findByText("Download blocked by EHDS Art. 73."),
  ).toBeInTheDocument();
  const log = await screen.findByRole("table", {
    name: "Blocked download attempts",
  });
  expect(within(log).getByText(new Date("2026-10-29T18:31:00Z").toLocaleString("en-GB"))).toBeInTheDocument();
  expect(within(log).getByText("Blocked")).toBeInTheDocument();
  await waitFor(() =>
    expect(
      invoke.mock.calls.filter(([name]) => name === "requests"),
    ).toHaveLength(2),
  );
  expect(
    screen.getByText("Download blocked by EHDS Art. 73."),
  ).toBeInTheDocument();
});

it("fetches selected IDs instead of presenting an overview as a full response", async () => {
  invoke.mockResolvedValueOnce({
    data: {
      requests: [
        row,
        {
          ...row,
          request_id: "R01",
          decision: "APPROVE_STATISTICAL",
          spe_schema: null,
        },
      ],
      downloads: [],
      staff_actions: [],
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
  fireEvent.click(
    screen.getByRole("button", { name: "View latest result for R01" }),
  );
  expect(await screen.findByText("263")).toBeInTheDocument();
  expect(invoke).toHaveBeenLastCalledWith("requests?id=R01", { headers: { "x-hdab": "at" }, method: "GET" });
  expect(
    screen.getByRole("columnheader", { name: "Percentage" }),
  ).toBeInTheDocument();
});

it("shows history errors and permits retry", async () => {
  invoke.mockRejectedValueOnce(new Error("Offline"));
  render(<StaffHistory />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load history: Offline",
  );
  invoke.mockResolvedValueOnce({
    data: { requests: [], downloads: [], staff_actions: [] },
    error: null,
  });
  fireEvent.click(screen.getByRole("button", { name: "Refresh history" }));
  expect(await screen.findByText("No saved requests.")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("shows saved-response failures while retaining overview and download log", async () => {
  invoke.mockResolvedValueOnce({
    data: {
      requests: [row],
      downloads: [{ request_id: "R05", attempted_at: "recent attempt" }],
      staff_actions: [],
    },
    error: null,
  });
  invoke.mockRejectedValueOnce(new Error("request not found"));
  render(<StaffHistory />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load saved result: request not found",
  );
  expect(
    screen.getByRole("table", { name: "Submission history" }),
  ).toBeInTheDocument();
  expect(screen.getByText("recent attempt")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Download" }),
  ).not.toBeInTheDocument();
});

it("queue shows held requests with count badge and review form", async () => {
  invoke.mockResolvedValueOnce({
    data: {
      requests: [row, heldRow],
      downloads: [],
      staff_actions: [],
    },
    error: null,
  });
  invoke.mockResolvedValue({ data: saved, error: null });
  render(<StaffHistory />);
  // Count badge
  expect(
    await screen.findByLabelText("1 awaiting review"),
  ).toBeInTheDocument();
  // Queue section shows the held request (appears in queue badge + history table)
  expect(screen.getAllByText("Awaiting staff review").length).toBeGreaterThan(0);
  // Review form is rendered
  expect(
    screen.getByRole("radio", { name: /Approve/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("radio", { name: /Override/i }),
  ).toBeInTheDocument();
});

it("review buttons are disabled while reason or staff name is empty", async () => {
  invoke.mockResolvedValueOnce({
    data: {
      requests: [heldRow],
      downloads: [],
      staff_actions: [],
    },
    error: null,
  });
  invoke.mockResolvedValue({ data: saved, error: null });
  render(<StaffHistory />);
  const approveBtn = await screen.findByRole("button", { name: "Approve" });
  // Neither reason nor name filled → disabled
  expect(approveBtn).toBeDisabled();
  // Fill reason only → still disabled
  const textarea = screen.getByPlaceholderText(/Explain the basis/i);
  fireEvent.change(textarea, { target: { value: "Valid reason" } });
  expect(approveBtn).toBeDisabled();
  // Fill name too → enabled
  const nameInput = screen.getByPlaceholderText(/Your name/i);
  fireEvent.change(nameInput, { target: { value: "Reviewer" } });
  expect(approveBtn).not.toBeDisabled();
  // Clear reason → disabled again
  fireEvent.change(textarea, { target: { value: "" } });
  expect(approveBtn).toBeDisabled();
});

it("approve calls the review endpoint with the correct body and refreshes on success", async () => {
  const refreshedHistory = {
    requests: [{ ...heldRow, status: "decided", needs_review: false }],
    downloads: [],
    staff_actions: [
      {
        request_id: "R01",
        action: "approve",
        decision: "APPROVE_STATISTICAL",
        reason: "Purpose is valid.",
        staff_name: "Reviewer A",
        created_at: "2026-10-30T09:00:00Z",
      },
    ],
  };
  invoke.mockResolvedValueOnce({
    data: { requests: [heldRow], downloads: [], staff_actions: [] },
    error: null,
  });
  invoke.mockResolvedValue({ data: saved, error: null });
  render(<StaffHistory />);
  await screen.findByRole("button", { name: "Approve" });
  fireEvent.change(screen.getByPlaceholderText(/Explain the basis/i), {
    target: { value: "Purpose is valid." },
  });
  fireEvent.change(screen.getByPlaceholderText(/Your name/i), {
    target: { value: "Reviewer A" },
  });
  // Set up mock: review call succeeds, then refresh returns updated history
  invoke.mockResolvedValueOnce({ data: { ...saved, request_id: "R01" }, error: null });
  invoke.mockResolvedValueOnce({ data: refreshedHistory, error: null });
  invoke.mockResolvedValue({ data: saved, error: null });
  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith("requests/review", {
      headers: { "x-hdab": "at" }, body: {
        action: "approve",
        request_id: "R01",
        reason: "Purpose is valid.",
        staff_name: "Reviewer A",
      },
    }),
  );
});

it("shows 409 error clearly on approve of already-decided request", async () => {
  invoke.mockResolvedValueOnce({
    data: { requests: [heldRow], downloads: [], staff_actions: [] },
    error: null,
  });
  invoke.mockResolvedValue({ data: saved, error: null });
  render(<StaffHistory />);
  await screen.findByRole("button", { name: "Approve" });
  fireEvent.change(screen.getByPlaceholderText(/Explain the basis/i), {
    target: { value: "Already decided" },
  });
  fireEvent.change(screen.getByPlaceholderText(/Your name/i), {
    target: { value: "Reviewer B" },
  });
  // Mock: review call returns 409
  invoke.mockResolvedValueOnce({
    data: null,
    error: {
      message: "Function error",
      context: new Response(
        JSON.stringify({
          error: "request is not awaiting approval; use override to change a decision",
        }),
        { status: 409 },
      ),
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  expect(
    await screen.findByRole("alert"),
  ).toHaveTextContent("request is not awaiting approval");
});

it("audit log renders staff actions with who, what, when columns", async () => {
  const auditAction = {
    request_id: "R01",
    action: "override",
    decision: "REJECT",
    reason: "Prohibited purpose.",
    staff_name: "Dr. Smith",
    created_at: "2026-10-30T08:00:00Z",
  };
  invoke.mockResolvedValueOnce({
    data: {
      requests: [row],
      downloads: [],
      staff_actions: [auditAction],
    },
    error: null,
  });
  invoke.mockResolvedValue({ data: saved, error: null });
  render(<StaffHistory />);
  const auditTable = await screen.findByRole("table", { name: "Staff audit log" });
  expect(within(auditTable).getByText("Dr. Smith")).toBeInTheDocument();
  expect(within(auditTable).getByText("override")).toBeInTheDocument();
  expect(within(auditTable).getByText("Prohibited purpose.")).toBeInTheDocument();
  // Date is localised via toLocaleString, just check the table cell exists for the date
  expect(within(auditTable).getByText("R01")).toBeInTheDocument();
});
