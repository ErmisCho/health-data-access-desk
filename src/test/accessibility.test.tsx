/**
 * Targeted accessibility tests for issue #75.
 *
 * Rules checked (without axe, using Testing Library queries):
 *  - One h1 per page / view
 *  - Every interactive element has an accessible name
 *  - Every input / select has an associated label
 *  - Landmark regions exist (main, nav)
 *  - The first-visit dialog and globe popover expose a title and description
 *  - ExamplesGallery labeled list and labeled sample buttons
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/lib/i18n";
import { HdabProvider } from "@/lib/hdab";
import { PreferencesProvider } from "@/lib/preferences";
import { LandingPage } from "@/components/LandingPage";
import { SiteHeader } from "@/components/SiteHeader";
import { HowWeDecide } from "@/components/HowWeDecide";
import { ExamplesGallery } from "@/components/ExamplesGallery";
import { saveHdab } from "@/lib/hdab-selection";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

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
];

// ── helpers ──────────────────────────────────────────────────────────────────

async function mountWithRouter(
  path: string,
  component: React.ComponentType,
  extras: Array<{ path: string; component?: React.ComponentType }> = [],
) {
  const root = createRootRoute();
  const main = createRoute({ getParentRoute: () => root, path, component });
  const extraRoutes = extras.map((e) =>
    createRoute({ getParentRoute: () => root, path: e.path, component: e.component }),
  );
  const router = createRouter({
    routeTree: root.addChildren([main, ...extraRoutes]),
    history: createMemoryHistory({ initialEntries: [path] }),
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
  return router;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  saveHdab("at");
  // Mark setup complete so the first-visit dialog doesn't hide page content
  localStorage.setItem("ehds-setup-complete", "true");
  vi.mocked(supabase.functions.invoke).mockResolvedValue({
    data: { configs, entries: [] },
    error: null,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// ── Landing page ─────────────────────────────────────────────────────────────

describe("Landing page accessibility", () => {
  const extras = [
    { path: "/desk" },
    { path: "/examples" },
    { path: "/how-we-decide" },
    { path: "/register" },
  ];

  it("has exactly one h1", async () => {
    await mountWithRouter("/", LandingPage, extras);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("has a main landmark", async () => {
    await mountWithRouter("/", LandingPage, extras);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("has a navigation landmark", async () => {
    await mountWithRouter("/", LandingPage, extras);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
  });

  it("all buttons and links have an accessible name", async () => {
    await mountWithRouter("/", LandingPage, extras);
    await screen.findByRole("heading", { level: 1 });
    for (const el of screen.queryAllByRole("button")) {
      expect(el, `button "${el.textContent}" has no accessible name`).toHaveAccessibleName();
    }
    for (const el of screen.queryAllByRole("link")) {
      expect(el, `link "${el.textContent}" has no accessible name`).toHaveAccessibleName();
    }
  });
});

// ── SiteHeader first-visit dialog ─────────────────────────────────────────────

describe("SiteHeader first-visit dialog accessibility", () => {
  async function mountHeader(setupComplete = false) {
    if (setupComplete) localStorage.setItem("ehds-setup-complete", "true");
    else localStorage.removeItem("ehds-setup-complete");

    const root = createRootRoute();
    const index = createRoute({
      getParentRoute: () => root,
      path: "/",
      component: SiteHeader,
    });
    const router = createRouter({
      routeTree: root.addChildren([index]),
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

  it("setup dialog has a title and description", async () => {
    await mountHeader(false);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Choose your access desk");
    expect(dialog).toHaveAccessibleDescription(/Choose an access body/);
  });

  it("globe popover selects have labels", async () => {
    await mountHeader(true);
    fireEvent.click(screen.getByRole("button", { name: "Language and access body" }));
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Access body" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "View role" })).toBeInTheDocument();
  });
});

// ── HowWeDecide ───────────────────────────────────────────────────────────────

describe("HowWeDecide accessibility", () => {
  it("has exactly one h1 and all regions are labeled", async () => {
    await mountWithRouter("/how-we-decide", HowWeDecide, [
      { path: "/" },
      { path: "/examples" },
    ]);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    for (const section of screen.queryAllByRole("region")) {
      expect(section, `region missing accessible name`).toHaveAccessibleName();
    }
  });
});

// ── ExamplesGallery ───────────────────────────────────────────────────────────

describe("ExamplesGallery accessibility", () => {
  it("has exactly one h1, a labeled list and labeled sample buttons", async () => {
    await mountWithRouter("/examples", ExamplesGallery, [
      { path: "/" },
      { path: "/how-we-decide" },
    ]);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("list", { name: "Sample requests" })).toBeInTheDocument();
    for (const btn of within(
      screen.getByRole("list", { name: "Sample requests" }),
    ).getAllByRole("button")) {
      expect(btn).toHaveAccessibleName();
    }
  });
});
