import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_ENTRIES } from "@/lib/ehds";
import { Route as DeskRoute } from "@/routes/desk";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

async function renderDesk(entry: string) {
  const root = createRootRoute();
  const desk = createRoute({
    getParentRoute: () => root,
    path: "/desk",
    validateSearch: DeskRoute.options.validateSearch!,
    component: DeskRoute.options.component!,
  });
  const router = createRouter({
    routeTree: root.addChildren([desk]),
    history: createMemoryHistory({ initialEntries: [entry] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  return screen.findByLabelText("View role");
}

describe("Desk route", () => {
  it.each(SAMPLE_ENTRIES)(
    "shows the submitted purpose and explanation for applicant sample $id",
    async ({ id, request }) => {
      const phrase = request.purpose.split(" ").slice(0, 3).join(" ");
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          request_id: id,
          decision: "APPROVE_STATISTICAL",
          articles: ["53"],
          reason: "Allowed",
          answer: null,
          explanation: {
            rule: "Matched purpose",
            trigger_phrases: [phrase],
            articles: [],
            plan_summary: "Count eligible patients per region.",
          },
        },
        error: null,
      });
      await renderDesk("/desk");
      fireEvent.change(screen.getByLabelText("Sample request"), {
        target: { value: String(SAMPLE_ENTRIES.findIndex((entry) => entry.id === id)) },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
      const panel = await screen.findByRole("region", { name: "Decision explanation" });
      expect(within(panel).getByText("Request purpose").nextElementSibling?.textContent).toBe(
        request.purpose,
      );
      expect(panel.querySelector("mark")?.textContent).toBe(phrase);
      expect(within(panel).getByText("Count eligible patients per region.")).toBeInTheDocument();
      expect(supabase.functions.invoke).toHaveBeenCalledWith("requests", { body: request });
    },
  );

  it.each(["/desk", "/desk?view=unknown"])("opens the applicant view for %s", async (entry) => {
    const roles = await renderDesk(entry);
    expect(within(roles).getByRole("button", { name: "applicant" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Request JSON")).toBeVisible();
  });

  it("opens the demo from search and preserves applicant state across role changes", async () => {
    const roles = await renderDesk("/desk?view=demo");
    expect(within(roles).getByRole("button", { name: "demo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(roles).getByRole("button", { name: "applicant" }));
    const request = screen.getByLabelText("Request JSON");
    fireEvent.change(request, { target: { value: '{"purpose":"research"}' } });
    fireEvent.click(within(roles).getByRole("button", { name: "staff" }));
    expect(within(roles).getByRole("button", { name: "staff" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(roles).getByRole("button", { name: "applicant" }));
    expect(request).toBeVisible();
    expect(request).toHaveValue('{"purpose":"research"}');
  });
});
