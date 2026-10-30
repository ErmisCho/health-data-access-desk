import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";
import { Route as DeskRoute } from "@/routes/desk";

afterEach(cleanup);

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
