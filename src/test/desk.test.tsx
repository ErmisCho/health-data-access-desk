import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_ENTRIES } from "@/lib/ehds";
import { Route as DeskRoute } from "@/routes/desk";

import { PreferencesProvider } from "@/lib/preferences";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("ehds-setup-complete", "true");
});

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
  render(<PreferencesProvider><RouterProvider router={router} /></PreferencesProvider>);
  return screen.findByRole("button", { name: /^Change view role:/ });
}

async function selectRole(role: string) {
  fireEvent.keyDown(screen.getByRole("button", { name: /^Change view role:/ }), { key: "ArrowDown" });
  fireEvent.click(await screen.findByRole("menuitemradio", { name: role }));
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
      // Switch to JSON tab first (default is Guided)
      fireEvent.click(screen.getByRole("button", { name: "JSON", hidden: true }));
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
      expect(supabase.functions.invoke).toHaveBeenCalledWith("requests", {
        headers: { "x-hdab": "at" },
        body: request,
      });
    },
  );

  it.each(["sample", "json", "tab", "guided sample", "guided field"])("clears the previous decision on %s changes", async (change) => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { request_id: "R01", decision: "APPROVE_STATISTICAL", articles: ["53"], reason: "Allowed", answer: null },
      error: null,
    });
    await renderDesk("/desk");
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    const guided = change.startsWith("guided");
    if (guided) {
      fireEvent.change(screen.getByLabelText("Load a sample"), { target: { value: "0" } });
      fireEvent.click(screen.getByRole("button", { name: /3\./ }));
    } else {
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    await screen.findByRole("heading", { name: "Decision" });
    if (change === "sample") fireEvent.change(screen.getByLabelText("Sample request"), { target: { value: "1" } });
    if (change === "json") fireEvent.change(screen.getByLabelText("Request JSON"), { target: { value: "{}" } });
    if (change === "tab") fireEvent.click(screen.getByRole("button", { name: "Guided" }));
    if (change === "guided sample") fireEvent.change(screen.getByLabelText("Load a sample"), { target: { value: "1" } });
    if (change === "guided field") {
      fireEvent.click(screen.getByRole("button", { name: /3\./ }));
      fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Changed name" } });
    }
    expect(screen.queryByRole("heading", { name: "Decision" })).not.toBeInTheDocument();
  });

  it.each(["/desk", "/desk?view=unknown"])("opens the applicant view for %s", async (entry) => {
    const roles = await renderDesk(entry);
    expect(roles).toHaveAccessibleName("Change view role: applicant");
    // Switch to JSON tab to find Request JSON textarea
    fireEvent.click(screen.getByRole("button", { name: "JSON", hidden: true }));
    expect(screen.getByLabelText("Request JSON")).toBeVisible();
  });

  it("opens the demo from search and preserves applicant state across role changes", async () => {
    const roles = await renderDesk("/desk?view=demo");
    expect(roles).toHaveAccessibleName("Change view role: demo");
    await selectRole("applicant");
    // Switch to JSON tab
    fireEvent.click(screen.getByRole("button", { name: "JSON", hidden: true }));
    const request = screen.getByLabelText("Request JSON");
    fireEvent.change(request, { target: { value: '{"purpose":"research"}' } });
    await selectRole("staff");
    expect(roles).toHaveAccessibleName("Change view role: staff");
    await selectRole("applicant");
    // Switch to JSON tab again — state is preserved inside JsonEditor
    fireEvent.click(screen.getByRole("button", { name: "JSON", hidden: true }));
    expect(screen.getByLabelText("Request JSON")).toBeVisible();
    expect(screen.getByLabelText("Request JSON")).toHaveValue('{"purpose":"research"}');
  });

  it.each(["applicant", "staff", "demo"] as const)(
    "has exactly one h1 on /desk with role=%s",
    async (role) => {
      localStorage.setItem("ehds-role", role);
      await renderDesk("/desk");
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    },
  );
});
