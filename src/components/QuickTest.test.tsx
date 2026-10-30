import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/lib/ehds", () => ({ submitRequest: vi.fn() }));
import { submitRequest, type DecisionResult } from "@/lib/ehds";
import { QuickTest } from "./QuickTest";

const submit = vi.mocked(submitRequest);
const request = (id: string) => ({
  id,
  submitted: "2026-10-30",
  applicant: { name: "Judge", organisation: "Jury", country: "AT" },
  requested_as: "health data request",
  requested_format: "anonymised statistics",
  purpose: "Research",
  question: `Question for ${id}`,
  definitions: [],
});
const result = (id: string): DecisionResult => ({
  request_id: id,
  decision: "APPROVE_STATISTICAL",
  articles: ["Art. 53", "Art. 69"],
  reason: "Allowed",
  answer: null,
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("parses an array into two rows and submits sequentially with live status", async () => {
  let finishFirst!: (value: DecisionResult) => void;
  submit.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
  );
  submit.mockResolvedValueOnce({ ...result("B"), needs_review: true });
  render(<QuickTest />);
  fireEvent.change(screen.getByLabelText("Request JSON"), {
    target: { value: JSON.stringify([request("A"), request("B")]) },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run all" }));
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(submit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent("Running requests");
  expect(screen.getByRole("button", { name: "Run all" })).toBeDisabled();
  finishFirst(result("A"));
  await screen.findByText("Held for a person");
  expect(submit.mock.calls).toEqual([[request("A")], [request("B")]]);
  const first = screen.getByRole("rowheader", { name: "A" }).closest("tr")!;
  expect(first).toHaveTextContent("Approved – statistics");
  expect(first).toHaveTextContent("Art. 53, Art. 69");
  expect(within(first).getByRole("link", { name: "Open letter" })).toHaveAttribute(
    "href",
    "/desk/letter/A",
  );
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Run complete"));
});

it("shows an invalid file error while a request from another file succeeds", async () => {
  submit.mockResolvedValue(result("GOOD"));
  render(<QuickTest />);
  fireEvent.change(screen.getByLabelText("JSON files"), {
    target: {
      files: [
        new File(["{broken"], "broken.json", { type: "application/json" }),
        new File([JSON.stringify(request("GOOD"))], "good.json", { type: "application/json" }),
      ],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run all" }));
  await screen.findByText("Approved – statistics");
  expect(screen.getAllByRole("row")).toHaveLength(3);
  const badRow = screen.getByRole("rowheader", { name: "broken.json" }).closest("tr")!;
  expect(badRow).toHaveTextContent("Error: Invalid JSON.");
  expect(submit).toHaveBeenCalledExactlyOnceWith(request("GOOD"));
});

it("continues after a backend rejection and accepts dropped arrays", async () => {
  submit.mockRejectedValueOnce(new Error("Invalid request shape"));
  submit.mockResolvedValueOnce({ ...result("OK"), decision: "APPROVE_SPE" });
  render(<QuickTest />);
  const input = screen.getByLabelText("JSON files");
  fireEvent.drop(input.parentElement!, {
    dataTransfer: {
      files: [new File([JSON.stringify([request("BAD"), request("OK")])], "requests.json")],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run all" }));
  await screen.findByText("Approved – secure environment");
  expect(screen.getByText("Error: Invalid request shape")).toBeInTheDocument();
  expect(submit).toHaveBeenCalledTimes(2);
});
