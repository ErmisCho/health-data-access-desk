import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { DecisionResult } from "@/lib/ehds";
import { LangProvider, useLang } from "@/lib/i18n";
import { createDecisionLetter } from "@/lib/decision-letter";
import { buildDecisionLetterPdf } from "@/lib/decision-letter-pdf";
import { DecisionDetails } from "./DecisionDetails";
import { DecisionLetter } from "./DecisionLetter";
import { LegalQuote } from "./LegalQuote";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));

const result: DecisionResult = {
  request_id: "R02",
  decision: "REJECT",
  articles: ["Art. 54"],
  reason: "Advertising and marketing are prohibited purposes for health data (Art. 54).",
  answer: null,
  explanation: {
    rule: "Prohibited purpose (Art. 54)",
    trigger_phrases: [],
    articles: [{
      number: "54",
      ref: "Art. 54",
      title: "Prohibited secondary use",
      summary: "Prohibits using health data for insurance decisions, advertising, harmful products, employee profiling, or third-party sharing outside the permit.",
      quote: "advertising or marketing activities;",
      applies: "advertising or marketing activities",
    }],
  },
};
const article = result.explanation!.articles[0]!;
const germanReason = "Werbung und Marketing sind verbotene Zwecke für Gesundheitsdaten (Art. 54).";
const germanSummary = "Verbietet die Nutzung von Gesundheitsdaten für Versicherungsentscheidungen, Werbung, schädliche Produkte, Mitarbeiterprofilierung oder Weitergabe an Dritte außerhalb der Genehmigung.";

function LanguageSwitch() {
  const { setLang } = useLang();
  return <button onClick={() => setLang("de")}>Deutsch</button>;
}

afterEach(() => {
  cleanup();
  sessionStorage.removeItem("ehds-lang");
});

it("updates the R02 reason and explanation rule when the active language changes to German", () => {
  sessionStorage.setItem("ehds-lang", "en");
  render(<LangProvider><LanguageSwitch /><DecisionDetails result={result} /></LangProvider>);
  expect(screen.getByText(result.reason)).toBeVisible();
  expect(screen.getByText(result.explanation!.rule)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Deutsch" }));
  expect(screen.getByText(germanReason)).toBeVisible();
  expect(screen.getByText("Verbotener Zweck (Art. 54)")).toBeVisible();
  expect(screen.queryByText(result.reason)).not.toBeInTheDocument();
});

it.each(["en", "de"])("localizes legal titles and summaries in %s while preserving quote and applies", (lang) => {
  sessionStorage.setItem("ehds-lang", lang);
  const { container } = render(<LangProvider><LegalQuote article={article} /></LangProvider>);
  expect(container.querySelector("figcaption")).toHaveTextContent(lang === "de" ? "Verbotene Sekundärnutzung" : article.title);
  expect(screen.getByText(lang === "de" ? germanSummary : article.summary)).toBeVisible();
  expect(container.querySelector("blockquote")?.textContent).toBe(article.quote);
  expect(container.querySelector("blockquote strong")?.textContent).toBe(article.applies);
});

it("localizes an English letter model for German display and PDF export", () => {
  sessionStorage.setItem("ehds-lang", "de");
  const letter = createDecisionLetter(result);
  render(<LangProvider><DecisionLetter letter={letter} /></LangProvider>);
  expect(screen.getByText("Verbotener Zweck (Art. 54)")).toBeVisible();
  expect(screen.getByText(germanSummary)).toBeVisible();
  const germanPdf = buildDecisionLetterPdf(letter, undefined, "de").output();
  expect(germanPdf).toContain("Verbotener Zweck");
  expect(germanPdf).not.toContain(article.title);
  const englishPdf = buildDecisionLetterPdf(letter).output();
  expect(englishPdf).toContain("Prohibited purpose");
  expect(englishPdf).toContain(article.title);
  expect(letter.rule).toBe(result.explanation!.rule);
  expect(letter.articles[0]!.quote).toBe(article.quote);
});
