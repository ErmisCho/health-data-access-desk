import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_ENTRIES, type Decision, type DecisionResult } from "@/lib/ehds";
import { ExamplesGallery } from "./ExamplesGallery";
import { HowWeDecide } from "./HowWeDecide";

const invoke = vi.mocked(supabase.functions.invoke);
const decisions: Decision[] = [
  "APPROVE_STATISTICAL",
  "REJECT",
  "APPROVE_STATISTICAL",
  "REJECT",
  "APPROVE_SPE",
  "REJECT",
  "APPROVE_STATISTICAL",
  "APPROVE_STATISTICAL",
  "APPROVE_STATISTICAL",
  "REJECT",
];
const live: DecisionResult = {
  request_id: "R01",
  decision: "APPROVE_STATISTICAL",
  articles: ["53", "69"],
  reason: "Current backend reason",
  answer: { Wien: { adults: 4321 } },
};

async function show(path: string) {
  const root = createRootRoute();
  const routes = [
    createRoute({ getParentRoute: () => root, path: "/how-we-decide", component: HowWeDecide }),
    createRoute({ getParentRoute: () => root, path: "/examples", component: ExamplesGallery }),
    createRoute({ getParentRoute: () => root, path: "/desk" }),
    createRoute({ getParentRoute: () => root, path: "/" }),
  ];
  const router = createRouter({
    routeTree: root.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByRole("heading", { level: 1 });
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("explains the ordered legal checks and all measured safeguards and test results", async () => {
  await show("/how-we-decide");
  const main = screen.getByRole("main");
  for (const topic of [
    "Decision order",
    "Versioned rules and legal text",
    "Statistics and the small-cell rule",
    "Opt-out handling",
    "Secure processing and blocked downloads",
    "Testing: evaluation and jury simulation",
    "The role of AI",
  ]) {
    expect(within(main).getByRole("heading", { name: topic })).toBeVisible();
  }
  const order = within(main).getAllByRole("listitem");
  expect(order).toHaveLength(4);
  for (const [index, text] of [
    "Art. 54(1)(b)",
    "Art. 53 and 69",
    "Art. 53, 66, 68 and 73",
    "Art. 53, 66(2) and 69",
  ].entries()) {
    expect(order[index]).toHaveTextContent(text);
  }
  for (const fact of [
    "30 October 2026",
    "Art. 54(1)(c)",
    "Art. 54(1)(d)",
    "we will not use this for marketing",
    "unreadable definitions",
    "written reason recorded in an audit log",
    "same safeguards still apply",
    "decision_rules.json",
    "1.0.1",
    "14 rules",
    "rule id and rules version",
    "Regulation (EU) 2025/327",
    "42 stored paragraphs",
    "word for word",
    "fixed program",
    "Counts below 10",
    "<10",
    "fewer than 10 people",
    "suppressed",
    "before any counting",
    "Every count starts from the eligible population (19,161 synthetic patients).",
    "Opt-out counts are never shown",
    "Only the cohort’s pseudonymised records",
    "HTTP 403",
    "logged under Art. 73",
    "10/10",
    "6/6",
    "0 leaks",
    "3 runs",
    "42 jury test requests",
    "0 wrong decisions",
    "13 prohibited purposes rejected",
    "synthetic data, not real applications",
    "No AI decides today",
    "only make outcomes stricter",
    "never sees patient data",
  ]) {
    expect(main).toHaveTextContent(fact);
  }
});

it("shows ten original questions, applicant types, expected badges and reasons without fetching", async () => {
  await show("/examples");
  const cards = within(screen.getByRole("list", { name: "Sample requests" })).getAllByRole(
    "listitem",
  );
  expect(cards).toHaveLength(10);
  SAMPLE_ENTRIES.forEach((sample, index) => {
    const card = cards[index]!;
    expect(card).toHaveTextContent(sample.id);
    expect(card).toHaveTextContent(sample.request.question);
    expect(card).toHaveTextContent(sample.request.requested_as);
    expect(within(card).getByText(decisions[index]!)).toBeVisible();
    expect(within(card).getByRole("button", { name: `Open ${sample.label}` })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
  expect(cards[8]).toHaveTextContent("pseudonymised records are not justified");
  expect(invoke).not.toHaveBeenCalled();
});

it.each(SAMPLE_ENTRIES)("opens the full live result for $id via the data layer", async (sample) => {
  invoke.mockResolvedValue({ data: { ...live, request_id: sample.id }, error: null });
  await show("/examples");
  fireEvent.click(screen.getByRole("button", { name: `Open ${sample.label}` }));
  const result = screen.getByRole("region", { name: `${sample.id} · Live result` });
  expect(await within(result).findByText("Current backend reason")).toBeVisible();
  expect(within(result).getByText("Art. 53")).toBeVisible();
  expect(within(result).getByText("4321")).toBeVisible();
  expect(within(result).getByRole("link", { name: "View decision letter" })).toHaveAttribute(
    "href",
    `/desk/letter/${sample.id}`,
  );
  expect(invoke).toHaveBeenCalledExactlyOnceWith("requests", {
    headers: { "x-hdab": "at" },
    body: sample.request,
  });
  expect(screen.getByRole("heading", { name: `${sample.id} · Live result` })).toHaveFocus();
});

it("announces pending requests and allows retry after an error", async () => {
  let fail!: (reason: Error) => void;
  invoke.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  await show("/examples");
  fireEvent.click(screen.getByRole("button", { name: /^Open R01/ }));
  expect(screen.getByRole("status")).toHaveTextContent("Loading R01");
  for (const card of within(screen.getByRole("list", { name: "Sample requests" })).getAllByRole(
    "button",
  ))
    expect(card).toBeDisabled();
  fail(new Error("Service unavailable"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  invoke.mockResolvedValueOnce({ data: live, error: null });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText(live.reason)).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
