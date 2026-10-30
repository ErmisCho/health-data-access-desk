import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

async function renderLanding() {
  const root = createRootRoute();
  const index = createRoute({ getParentRoute: () => root, path: "/", component: LandingPage });
  const desk = createRoute({ getParentRoute: () => root, path: "/desk" });
  const examples = createRoute({ getParentRoute: () => root, path: "/examples" });
  const methodology = createRoute({ getParentRoute: () => root, path: "/how-we-decide" });
  const router = createRouter({
    routeTree: root.addChildren([index, desk, examples, methodology]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByRole("heading", { name: "Can this health-data request be approved?" });
}

afterEach(cleanup);

describe("Landing page", () => {
  it("links the hero actions to the desk and transparency pages", async () => {
    await renderLanding();
    expect(screen.getByRole("link", { name: "Submit a request" })).toHaveAttribute("href", "/desk");
    expect(screen.getByRole("link", { name: "See examples" })).toHaveAttribute("href", "/examples");
    expect(
      within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", {
        name: "EHDS Access Desk",
      }),
    ).toHaveAttribute("href", "/");
    for (const scope of [
      screen.getByRole("main"),
      screen.getByRole("navigation", { name: "Main navigation" }),
    ]) {
      expect(within(scope).getByRole("link", { name: "How we decide" })).toHaveAttribute(
        "href",
        "/how-we-decide",
      );
    }
    expect(
      within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", {
        name: "Examples",
      }),
    ).toHaveAttribute("href", "/examples");
  });

  it("explains the process in three ordered steps", async () => {
    await renderLanding();
    const steps = within(screen.getByRole("list", { name: "How it works" })).getAllByRole(
      "listitem",
    );
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("Describe your request");
    expect(steps[1]).toHaveTextContent("EHDS Chapter IV");
    expect(steps[2]).toHaveTextContent("secure processing environment");
  });

  it("opens and closes each FAQ with an accessible trigger", async () => {
    await renderLanding();
    for (const name of [
      "What happens to data and privacy?",
      "What is the legal basis?",
      "How are decisions made?",
    ]) {
      const trigger = screen.getByRole("button", { name });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("region", { name })).toBeVisible();
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  });
});
