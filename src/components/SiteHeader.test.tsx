import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SiteHeader } from "./SiteHeader";
import { LandingPage } from "./LandingPage";
import { LangProvider } from "@/lib/i18n";
import { HdabProvider } from "@/lib/hdab";
import { PreferencesProvider, usePreferences } from "@/lib/preferences";
import { saveHdab } from "@/lib/hdab-selection";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
const configs = [
  {
    code: "at",
    country: "Austria",
    name: "Austria body",
    contact: "at@example.org",
    display_language: "en",
    languages: ["de", "en"],
    branding: { primary: "#20364d", accent: "#27665f" },
  },
  {
    code: "de",
    country: "Germany",
    name: "Germany body",
    contact: "de@example.org",
    display_language: "en",
    languages: ["de", "en"],
    branding: { primary: "#283e58", accent: "#58418a" },
  },
];

function RoleProbe() {
  return <p>{usePreferences().role}</p>;
}

async function mount(landing = false) {
  const root = createRootRoute();
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: landing ? LandingPage : SiteHeader,
  });
  const desk = createRoute({ getParentRoute: () => root, path: "/desk", component: RoleProbe });
  const routes = ["/register", "/how-we-decide", "/examples"].map((path) =>
    createRoute({ getParentRoute: () => root, path }),
  );
  const router = createRouter({
    routeTree: root.addChildren([index, desk, ...routes]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  render(
    <LangProvider>
      <HdabProvider>
        <PreferencesProvider>
          <RouterProvider router={router} />
        </PreferencesProvider>
      </HdabProvider>
    </LangProvider>,
  );
  await screen.findByText("Demonstration service · Health Data Access Body");
  return router;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  saveHdab("at");
  vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { configs }, error: null });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  saveHdab("at");
  vi.restoreAllMocks();
});

it("asks once, saves the body and role across remounts, and restores focus", async () => {
  await mount();
  const dialog = await screen.findByRole("dialog", { name: "Choose your access desk" });
  const body = within(dialog).getByRole("combobox", { name: "Access body" });
  await waitFor(() => expect(body).toBeEnabled());
  fireEvent.change(body, { target: { value: "de" } });
  fireEvent.change(within(dialog).getByRole("combobox", { name: "View role" }), {
    target: { value: "demo" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Continue" }));
  expect(localStorage.getItem("ehds-hdab")).toBe("de");
  expect(localStorage.getItem("ehds-role")).toBe("demo");
  expect(localStorage.getItem("ehds-setup-complete")).toBe("true");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Language and access body" })).toHaveFocus(),
  );
  cleanup();
  await mount();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "demo" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Language and access body" }));
  expect(screen.getByRole("combobox", { name: "Access body" })).toHaveValue("de");
});

it("changes preferences in the globe popover and closes it with Escape", async () => {
  localStorage.setItem("ehds-setup-complete", "true");
  await mount();
  const globe = screen.getByRole("button", { name: "Language and access body" });
  fireEvent.click(globe);
  const body = screen.getByRole("combobox", { name: "Access body" });
  await waitFor(() => expect(body).toBeEnabled());
  fireEvent.change(body, { target: { value: "de" } });
  fireEvent.change(screen.getByRole("combobox", { name: "View role" }), {
    target: { value: "staff" },
  });
  expect(screen.getByRole("button", { name: "staff" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.keyDown(body, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());
  expect(globe).toHaveFocus();
});

it("opens the collapsed navigation with the keyboard", async () => {
  localStorage.setItem("ehds-setup-complete", "true");
  await mount();
  const trigger = screen.getByRole("button", { name: "Navigation menu" });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  const menu = await screen.findByRole("menu");
  expect(within(menu).getByRole("menuitem", { name: "Examples" })).toHaveAttribute(
    "href",
    "/examples",
  );
  expect(within(menu).getByRole("menuitem", { name: "Transparency register" })).toHaveAttribute(
    "href",
    "/register",
  );
  fireEvent.keyDown(menu, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
});

it("keeps setup usable when persistent storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  await mount();
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Continue" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it.each([
  ["Submit a request", "applicant"],
  ["Staff sign-in", "staff"],
  ["Try the guided demo", "demo"],
])("sets the role from the landing action %s", async (label, role) => {
  localStorage.setItem("ehds-setup-complete", "true");
  localStorage.setItem("ehds-role", "demo");
  const router = await mount(true);
  fireEvent.click(screen.getByRole("link", { name: label }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/desk"));
  await waitFor(() => expect(screen.getByText(role, { selector: "p" })).toBeInTheDocument());
  expect(localStorage.getItem("ehds-role")).toBe(role);
});
