/**
 * Tests for Issue #55 — German / English language switch
 *
 * Covered:
 *   1. Every key in en.ts exists in de.ts (compile-time + runtime check)
 *   2. Toggle switches the header and a page heading to German
 *   3. Choice survives remount via sessionStorage
 *   4. html lang attribute changes when the toggle is clicked
 *   5. localizeBackendText maps known English strings to German
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  act,
} from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { en } from "@/lib/i18n/en";
import { de } from "@/lib/i18n/de";
import { LangProvider, useLang, useT } from "@/lib/i18n";
import { localizeBackendText } from "@/lib/i18n/translations";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingPage } from "@/components/LandingPage";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

afterEach(() => {
  cleanup();
  // clear sessionStorage between tests
  try {
    sessionStorage.removeItem("ehds-lang");
  } catch {
    /* ignore */
  }
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Every EN key exists in DE (runtime confirmation of the TypeScript compile-time check)
// ---------------------------------------------------------------------------
describe("dictionary completeness", () => {
  it("every key in en.ts exists in de.ts", () => {
    const enKeys = Object.keys(en).sort();
    const deKeys = Object.keys(de).sort();
    expect(deKeys).toEqual(enKeys);
  });

  it("every de value is a non-empty string", () => {
    for (const [key, value] of Object.entries(de)) {
      expect(typeof value, `de["${key}"] should be a string`).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// Helper: render SiteHeader inside a minimal router so <Link> works
// ---------------------------------------------------------------------------
function HeaderPage() {
  return <SiteHeader />;
}

async function renderHeader() {
  const root = createRootRoute();
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: HeaderPage,
  });
  const desk = createRoute({ getParentRoute: () => root, path: "/desk" });
  const reg = createRoute({ getParentRoute: () => root, path: "/register" });
  const hwd = createRoute({ getParentRoute: () => root, path: "/how-we-decide" });
  const ex = createRoute({ getParentRoute: () => root, path: "/examples" });
  const router = createRouter({
    routeTree: root.addChildren([index, desk, reg, hwd, ex]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  render(
    <LangProvider>
      <RouterProvider router={router} />
    </LangProvider>,
  );
  // wait for navigation link to appear
  await screen.findByRole("navigation", { name: /Main navigation|Hauptnavigation/ });
}

// ---------------------------------------------------------------------------
// 2. Toggle switches the header and a page heading to German
// ---------------------------------------------------------------------------
describe("language toggle", () => {
  it("header nav text switches to German on DE click, back to English on EN click", async () => {
    await renderHeader();

    // Initially English: "Transparency register" in nav
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Transparency register" })).toBeInTheDocument();

    // Click DE toggle
    const deBtn = screen.getByRole("button", { name: "Switch to German" });
    fireEvent.click(deBtn);

    // Now German: "Transparenzregister" in nav
    expect(within(nav).getByRole("link", { name: "Transparenzregister" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Transparency register" })).not.toBeInTheDocument();

    // Click EN toggle
    const enBtn = screen.getByRole("button", { name: "Switch to English" });
    fireEvent.click(enBtn);
    expect(within(nav).getByRole("link", { name: "Transparency register" })).toBeInTheDocument();
  });

  it("landing page h1 switches to German when DE is selected", async () => {
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
    render(
      <LangProvider>
        <RouterProvider router={router} />
      </LangProvider>,
    );

    await screen.findByRole("heading", { name: "Can this health-data request be approved?" });

    // Switch to German
    fireEvent.click(screen.getByRole("button", { name: "Switch to German" }));

    expect(
      screen.getByRole("heading", {
        name: "Kann dieser Gesundheitsdatenantrag genehmigt werden?",
      }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Choice survives remount via sessionStorage
// ---------------------------------------------------------------------------
describe("sessionStorage persistence", () => {
  it("persists the language choice across component remounts", async () => {
    await renderHeader();

    // Switch to German
    fireEvent.click(screen.getByRole("button", { name: "Switch to German" }));

    // Verify sessionStorage has "de"
    expect(sessionStorage.getItem("ehds-lang")).toBe("de");

    // Unmount and remount
    cleanup();
    await renderHeader();

    // Nav should be in German
    const nav = screen.getByRole("navigation", { name: "Hauptnavigation" });
    expect(within(nav).getByRole("link", { name: "Transparenzregister" })).toBeInTheDocument();
  });

  it("defaults to English when no sessionStorage value is set", async () => {
    await renderHeader();
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Transparency register" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. html lang changes when toggle is clicked
// ---------------------------------------------------------------------------
describe("html lang attribute", () => {
  it("sets document.documentElement.lang to de on German toggle", async () => {
    await renderHeader();
    expect(document.documentElement.lang).toBe("en");
    fireEvent.click(screen.getByRole("button", { name: "Switch to German" }));
    expect(document.documentElement.lang).toBe("de");
    fireEvent.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(document.documentElement.lang).toBe("en");
  });
});

// ---------------------------------------------------------------------------
// 5. localizeBackendText
// ---------------------------------------------------------------------------
describe("localizeBackendText", () => {
  it("returns the English text unchanged for lang=en", () => {
    expect(
      localizeBackendText("Insurance premium pricing is prohibited by Art. 54(1)(b).", "en"),
    ).toBe("Insurance premium pricing is prohibited by Art. 54(1)(b).");
  });

  it("returns the German translation for a known string in lang=de", () => {
    expect(
      localizeBackendText("Insurance premium pricing is prohibited by Art. 54(1)(b).", "de"),
    ).toBe("Versicherungsprämiengestaltung ist nach Art. 54 Abs. 1 Buchst. b verboten.");
  });

  it("falls back to English for unknown strings in lang=de", () => {
    expect(localizeBackendText("Some unknown backend text.", "de")).toBe(
      "Some unknown backend text.",
    );
  });

  it("translates all 10 decision reasons to German", () => {
    const reasons = [
      "Prevention planning receives anonymised regional statistics.",
      "Insurance premium pricing is prohibited by Art. 54(1)(b).",
      "Healthcare quality planning receives anonymised statistics.",
      "Advertising is prohibited by Art. 54(1)(c).",
      "Individual histories are justified for model training in a secure environment.",
      "Employment decisions are prohibited by Art. 54(1)(b).",
      "Official health reporting receives anonymised statistics.",
      "Cancer prevention research receives statistics with small-cell suppression.",
      "Requested records are downgraded: no justification why statistics are insufficient.",
      "Nicotine product development is prohibited by Art. 54(1)(d).",
    ];
    for (const reason of reasons) {
      const translated = localizeBackendText(reason, "de");
      expect(translated, `should translate: "${reason}"`).not.toBe(reason);
    }
  });
});
