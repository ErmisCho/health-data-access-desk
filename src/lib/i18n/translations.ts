/**
 * Front-end translation lookup for backend-supplied text.
 *
 * Backend fields (reason, rule label, article title, article summary,
 * plan_summary, purpose_category) come in English from the API.
 * For German, map the known English strings to German translations
 * using the exact strings from backend-strings.en.json.
 * If a string is not in the lookup it is returned unchanged (English fallback).
 *
 * plan_summary always stays in English; the DE suffix " (Englisch)" is added
 * by the component that renders it.
 *
 * Matching is done after trimming and normalising quotes on both sides.
 */

import type { Lang } from "../i18n";

/** Map English backend text → German translation. */
const BACKEND_DE: Record<string, string> = {
  // Register organisation types (exact backend values).
  "Research institution": "Forschungseinrichtung",
  "Healthcare provider": "Gesundheitsdienstleister",
  "Public body": "Öffentliche Stelle",
  "Insurer": "Versicherer",
  "Company": "Unternehmen",
  "Other": "Sonstige",

  // ── Decision reasons (result.reason) ─────────────────────────────────────
  "Advertising and marketing are prohibited purposes for health data (Art. 54).":
    "Werbung und Marketing sind verbotene Zwecke für Gesundheitsdaten (Art. 54).",

  "Developing or marketing nicotine or tobacco products is a prohibited purpose for health data (Art. 54).":
    "Die Entwicklung oder Vermarktung von Nikotin- oder Tabakprodukten ist ein verbotener Zweck für Gesundheitsdaten (Art. 54).",

  "Using health data for decisions about employees, or matching it with an employee list, is prohibited (Art. 54). This could re-identify individuals and harm them.":
    "Die Verwendung von Gesundheitsdaten für Entscheidungen über Beschäftigte oder deren Abgleich mit einer Mitarbeiterliste ist verboten (Art. 54). Dies könnte Personen re-identifizieren und schaden.",

  "Using health data to set or align insurance premiums is prohibited (Art. 54).":
    "Die Verwendung von Gesundheitsdaten zur Festsetzung oder Angleichung von Versicherungsprämien ist verboten (Art. 54).",

  "Your purpose is an allowed use of health data (Art. 53). Anonymised statistics are sufficient to answer the question (Art. 69).":
    "Ihr Zweck ist eine zulässige Nutzung von Gesundheitsdaten (Art. 53). Anonymisierte Statistiken sind ausreichend, um die Frage zu beantworten (Art. 69).",

  "Your purpose is an allowed use of health data (Art. 53). Anonymised statistics are sufficient to answer the question; pseudonymised records are not justified under Art. 66. Your request is approved as statistics (Art. 69).":
    "Ihr Zweck ist eine zulässige Nutzung von Gesundheitsdaten (Art. 53). Anonymisierte Statistiken sind ausreichend, um die Frage zu beantworten; pseudonymisierte Daten sind nach Art. 66 nicht gerechtfertigt. Ihr Antrag wird als Statistik genehmigt (Art. 69).",

  "Your purpose is an allowed use of health data (Art. 53). You have explained why anonymised statistics are not sufficient; pseudonymised patient-level data is justified (Art. 66). Access is granted inside a secure processing environment under a data permit (Art. 68, 73).":
    "Ihr Zweck ist eine zulässige Nutzung von Gesundheitsdaten (Art. 53). Sie haben erläutert, warum anonymisierte Statistiken nicht ausreichend sind; pseudonymisierte Patientendaten sind gerechtfertigt (Art. 66). Der Zugang wird in einer sicheren Verarbeitungsumgebung im Rahmen eines Datengenehmigungsverfahrens gewährt (Art. 68, 73).",

  // ── Rule labels (result.explanation.rule) ────────────────────────────────
  "Approved for anonymised statistics – access application (Art. 53, 66, 69)":
    "Genehmigt für anonymisierte Statistiken – Datenzugangsantrag (Art. 53, 66, 69)",

  "Approved for anonymised statistics – health data request (Art. 53, 69)":
    "Genehmigt für anonymisierte Statistiken – Datenantrag (Art. 53, 69)",

  "Approved for pseudonymised access – secure processing environment (Art. 53, 66, 68, 73)":
    "Genehmigt für pseudonymisierten Zugang – sichere Verarbeitungsumgebung (Art. 53, 66, 68, 73)",

  "Prohibited purpose (Art. 54)":
    "Verbotener Zweck (Art. 54)",

  // ── Article titles ────────────────────────────────────────────────────────
  "Data minimisation and purpose limitation":
    "Datensparsamkeit und Zweckbindung",

  "Data permit":
    "Datengenehmigung",

  "Health data request":
    "Datenantrag",

  "Prohibited secondary use":
    "Verbotene Sekundärnutzung",

  "Purposes for which electronic health data can be processed for secondary use":
    "Zwecke, für die elektronische Gesundheitsdaten zur Sekundärnutzung verarbeitet werden dürfen",

  "Secure processing environment":
    "Sichere Verarbeitungsumgebung",

  // ── Article summaries ─────────────────────────────────────────────────────
  "Allows applicants to request anonymised statistical answers (a 'health data request') without needing a full data permit.":
    "Erm\u00F6glicht es Antragstellenden, anonymisierte statistische Antworten (einen \u201EDatenantrag\u201C) anzufordern, ohne eine vollst\u00E4ndige Datengenehmigung zu ben\u00F6tigen.",

  "Governs the issuing of data permits: the access body assesses the application and may grant a time-limited permit for secure access.":
    "Regelt die Ausstellung von Datengenehmigungen: Die Zugangsstelle prüft den Antrag und kann eine befristete Genehmigung für den sicheren Zugang erteilen.",

  "Lists the allowed purposes for accessing health data for secondary use, including research, statistics, education, and quality improvement.":
    "Listet die zulässigen Zwecke für den Zugang zu Gesundheitsdaten zur Sekundärnutzung auf, einschließlich Forschung, Statistik, Bildung und Qualitätsverbesserung.",

  "Prohibits using health data for insurance decisions, advertising, harmful products, employee profiling, or third-party sharing outside the permit.":
    "Verbietet die Nutzung von Gesundheitsdaten für Versicherungsentscheidungen, Werbung, schädliche Produkte, Mitarbeiterprofilierung oder Weitergabe an Dritte außerhalb der Genehmigung.",

  "Requires that only the minimum necessary data be provided, in anonymised form unless pseudonymised data is justified.":
    "Verlangt, dass nur die minimal notwendigen Daten bereitgestellt werden, in anonymisierter Form, sofern pseudonymisierte Daten nicht gerechtfertigt sind.",

  "Requires that pseudonymised data be accessed only through a secure processing environment managed by the access body.":
    "Verlangt, dass auf pseudonymisierte Daten nur über eine sichere Verarbeitungsumgebung zugegriffen wird, die von der Zugangsstelle verwaltet wird.",

  // ── Register purpose categories ───────────────────────────────────────────
  "advertising or marketing":
    "Werbung oder Marketing",

  "AI/model training or validation":
    "KI-/Modelltraining oder -validierung",

  "clinical / epidemiological / treatment-gap":
    "klinisch / epidemiologisch / Versorgungslücke",

  "detrimental decisions about employees / re-identification":
    "nachteilige Entscheidungen über Beschäftigte / Re-Identifizierung",

  "development of alcoholic products":
    "Entwicklung von Alkoholprodukten",

  "insurance premiums / insurance decisions":
    "Versicherungsprämien / Versicherungsentscheidungen",

  "passing data to third parties not in permit":
    "Weitergabe von Daten an Dritte, die nicht in der Genehmigung aufgeführt sind",

  "prevention / guidelines / quality":
    "Prävention / Leitlinien / Qualität",

  "public health":
    "öffentliche Gesundheit",

  "re-identification of data subjects":
    "Re-Identifizierung von betroffenen Personen",

  "scientific research":
    "wissenschaftliche Forschung",

  "statistics / aggregates are not sufficient":
    "Statistiken / Aggregate sind nicht ausreichend",

  "tobacco / nicotine / illicit products":
    "Tabak / Nikotin / illegale Produkte",

  "weapons or illicit drugs":
    "Waffen oder illegale Drogen",
};

function normalizeBackendText(text: string): string {
  return text.trim().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

const NORMALIZED_BACKEND_DE: Record<string, string> = Object.fromEntries(
  Object.entries(BACKEND_DE).map(([key, value]) => [normalizeBackendText(key), value]),
);

/**
 * Translate a backend-supplied string to German.
 * Trims and normalises quotes before lookup; falls back to the English original.
 */
export function translateToDE(text: string): string {
  return NORMALIZED_BACKEND_DE[normalizeBackendText(text)] ?? text;
}

/**
 * Return the text in the given language.
 * For "en" the text is returned unchanged.
 * For "de" the lookup is applied; untranslated strings stay in English.
 */
export function localizeBackendText(text: string, lang: Lang): string {
  if (lang === "en") return text;
  return translateToDE(text);
}
