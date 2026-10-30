import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";
import { PreferencesProvider } from "@/lib/preferences";

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
  render(<PreferencesProvider><RouterProvider router={router} /></PreferencesProvider>);
  await screen.findByRole("heading", { name: "Can this health-data request be approved?" });
}

afterEach(() => { cleanup(); localStorage.clear(); });
// Skip the first-visit settings dialog, which would hide the page from role queries.
beforeEach(() => localStorage.setItem("ehds-setup-complete", "true"));

describe("Landing page", () => {
  it("opens the desk in demo mode for custom requests", async () => {
    await renderLanding();
    const action = screen.getByRole("link", { name: "Test your own requests" });
    expect(action).toHaveAttribute("href", "/desk");
    fireEvent.click(action);
    expect(localStorage.getItem("ehds-role")).toBe("demo");
  });

  it("shows 57 jury test requests with the honest limits", async () => {
    await renderLanding();
    const tile = screen.getByText("jury test requests: 0 wrong decisions, 0 leaks").parentElement!;
    expect(tile).toHaveTextContent("57");
    expect(screen.getByText(/a guarantee of future results/i)).toBeInTheDocument();
  });
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
