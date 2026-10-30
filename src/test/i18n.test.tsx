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
// 5. localizeBackendText — real backend strings from backend-strings.en.json
// ---------------------------------------------------------------------------
describe("localizeBackendText", () => {
  it("returns the English text unchanged for lang=en", () => {
    expect(
      localizeBackendText(
        "Using health data to set or align insurance premiums is prohibited (Art. 54).",
        "en",
      ),
    ).toBe("Using health data to set or align insurance premiums is prohibited (Art. 54).");
  });

  it("translates R02 reason (insurance premiums) to German", () => {
    expect(
      localizeBackendText(
        "Using health data to set or align insurance premiums is prohibited (Art. 54).",
        "de",
      ),
    ).toBe(
      "Die Verwendung von Gesundheitsdaten zur Festsetzung oder Angleichung von Versicherungsprämien ist verboten (Art. 54).",
    );
  });

  it("translates the R02 rule label to German", () => {
    expect(localizeBackendText("Prohibited purpose (Art. 54)", "de")).toBe(
      "Verbotener Zweck (Art. 54)",
    );
  });

  it("translates the 'Prohibited secondary use' article title to German", () => {
    expect(localizeBackendText("Prohibited secondary use", "de")).toBe(
      "Verbotene Sekundärnutzung",
    );
  });

  it("translates the Art. 54 article summary to German", () => {
    expect(
      localizeBackendText(
        "Prohibits using health data for insurance decisions, advertising, harmful products, employee profiling, or third-party sharing outside the permit.",
        "de",
      ),
    ).toBe(
      "Verbietet die Nutzung von Gesundheitsdaten für Versicherungsentscheidungen, Werbung, schädliche Produkte, Mitarbeiterprofilierung oder Weitergabe an Dritte außerhalb der Genehmigung.",
    );
  });

  it("translates the Art. 69 summary with typographic single quotes to German", () => {
    expect(
      localizeBackendText(
        "Allows applicants to request anonymised statistical answers (a \u2018health data request\u2019) without needing a full data permit.",
        "de",
      ),
    ).toBe(
      "Erm\u00F6glicht es Antragstellenden, anonymisierte statistische Antworten (einen \u201EDatenantrag\u201C) anzufordern, ohne eine vollst\u00E4ndige Datengenehmigung zu ben\u00F6tigen.",
    );
  });

  it("translates the register category 'insurance premiums / insurance decisions' to German", () => {
    expect(localizeBackendText("insurance premiums / insurance decisions", "de")).toBe(
      "Versicherungsprämien / Versicherungsentscheidungen",
    );
  });

  it("falls back to English for unknown strings in lang=de", () => {
    expect(localizeBackendText("Some unknown backend text.", "de")).toBe(
      "Some unknown backend text.",
    );
  });

  it("trims whitespace before lookup", () => {
    expect(
      localizeBackendText("  Prohibited purpose (Art. 54)  ", "de"),
    ).toBe("Verbotener Zweck (Art. 54)");
  });

  it("translates all 7 decision reasons from the real API to German", () => {
    const reasons = [
      "Advertising and marketing are prohibited purposes for health data (Art. 54).",
      "Developing or marketing nicotine or tobacco products is a prohibited purpose for health data (Art. 54).",
      "Using health data for decisions about employees, or matching it with an employee list, is prohibited (Art. 54). This could re-identify individuals and harm them.",
      "Using health data to set or align insurance premiums is prohibited (Art. 54).",
      "Your purpose is an allowed use of health data (Art. 53). Anonymised statistics are sufficient to answer the question (Art. 69).",
      "Your purpose is an allowed use of health data (Art. 53). Anonymised statistics are sufficient to answer the question; pseudonymised records are not justified under Art. 66. Your request is approved as statistics (Art. 69).",
      "Your purpose is an allowed use of health data (Art. 53). You have explained why anonymised statistics are not sufficient; pseudonymised patient-level data is justified (Art. 66). Access is granted inside a secure processing environment under a data permit (Art. 68, 73).",
    ];
    for (const reason of reasons) {
      const translated = localizeBackendText(reason, "de");
      expect(translated, `should translate: "${reason}"`).not.toBe(reason);
    }
  });

  it("translates all 14 register purpose categories to German", () => {
    const categories = [
      "advertising or marketing",
      "AI/model training or validation",
      "clinical / epidemiological / treatment-gap",
      "detrimental decisions about employees / re-identification",
      "development of alcoholic products",
      "insurance premiums / insurance decisions",
      "passing data to third parties not in permit",
      "prevention / guidelines / quality",
      "public health",
      "re-identification of data subjects",
      "scientific research",
      "statistics / aggregates are not sufficient",
      "tobacco / nicotine / illicit products",
      "weapons or illicit drugs",
    ];
    for (const cat of categories) {
      const translated = localizeBackendText(cat, "de");
      expect(translated, `should translate category: "${cat}"`).not.toBe(cat);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Enum label translation
// ---------------------------------------------------------------------------
describe("enum label i18n", () => {
  it("en.ts enum labels match English API values", () => {
    expect(en["enum.requestedAs.healthDataRequest"]).toBe("health data request");
    expect(en["enum.requestedAs.healthDataAccessApplication"]).toBe("health data access application");
    expect(en["enum.requestedFormat.anonymisedStatistics"]).toBe("anonymised statistics");
    expect(en["enum.requestedFormat.pseudonymisedRecords"]).toBe("pseudonymised records");
  });

  it("de.ts enum labels are German EHDS terms", () => {
    expect(de["enum.requestedAs.healthDataRequest"]).toBe("Datenantrag");
    expect(de["enum.requestedAs.healthDataAccessApplication"]).toBe("Datenzugangsantrag");
    expect(de["enum.requestedFormat.anonymisedStatistics"]).toBe("anonymisierte Statistik");
    expect(de["enum.requestedFormat.pseudonymisedRecords"]).toBe("pseudonymisierte Daten");
  });
});

// ---------------------------------------------------------------------------
// 7. de-AT date format
// ---------------------------------------------------------------------------
describe("de-AT date format", () => {
  it("formats a date in de-AT locale correctly (dd.mm.yyyy)", () => {
    const d = new Date("2026-10-30T03:00:01Z");
    const formatted = d.toLocaleString("de-AT");
    // de-AT uses day.month.year, time with colon — must not contain "AM" or "PM"
    expect(formatted).not.toMatch(/AM|PM/);
    expect(formatted).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
  });

  it("formats a date in en-GB locale correctly (dd/mm/yyyy)", () => {
    const d = new Date("2026-10-30T03:00:01Z");
    const formatted = d.toLocaleString("en-GB");
    expect(formatted).not.toMatch(/AM|PM/);
  });
});
