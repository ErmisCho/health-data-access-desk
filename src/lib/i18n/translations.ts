/**
 * Front-end translation lookup for backend-supplied text.
 *
 * Backend fields (reason, rule label, article summary, plan_summary) come in
 * English. For German, map the known English strings to German translations.
 * If a string is not in the lookup, it is returned unchanged (English fallback).
 *
 * Covers outcomes R01-R10 and the rule labels found in decision_rules.json.
 *
 * plan_summary always stays in English; the DE suffix " (Englisch)" is added
 * by the component that renders it.
 */

/** Map English reason/rule text → German translation. */
const REASON_DE: Record<string, string> = {
  // ── decision reasons (result.reason) ────────────────────────────────────────
  "Prevention planning receives anonymised regional statistics.":
    "Präventionsplanung erhält anonymisierte regionale Statistiken.",
  "Insurance premium pricing is prohibited by Art. 54(1)(b).":
    "Versicherungsprämiengestaltung ist nach Art. 54 Abs. 1 Buchst. b verboten.",
  "Healthcare quality planning receives anonymised statistics.":
    "Qualitätsplanung im Gesundheitswesen erhält anonymisierte Statistiken.",
  "Advertising is prohibited by Art. 54(1)(c).":
    "Werbung ist nach Art. 54 Abs. 1 Buchst. c verboten.",
  "Individual histories are justified for model training in a secure environment.":
    "Individuelle Verläufe sind für das Modelltraining in einer sicheren Verarbeitungsumgebung gerechtfertigt.",
  "Employment decisions are prohibited by Art. 54(1)(b).":
    "Beschäftigungsentscheidungen sind nach Art. 54 Abs. 1 Buchst. b verboten.",
  "Official health reporting receives anonymised statistics.":
    "Amtliche Gesundheitsberichterstattung erhält anonymisierte Statistiken.",
  "Cancer prevention research receives statistics with small-cell suppression.":
    "Krebspräventionsforschung erhält Statistiken mit Unterdrückung kleiner Zellen.",
  "Requested records are downgraded: no justification why statistics are insufficient.":
    "Beantragte Datensätze werden herabgestuft: keine Begründung, warum Statistiken unzureichend sind.",
  "Nicotine product development is prohibited by Art. 54(1)(d).":
    "Nikotinproduktentwicklung ist nach Art. 54 Abs. 1 Buchst. d verboten.",

  // ── rule labels from decision_rules.json (result.explanation.rule) ──────────
  "Prohibited purpose: insurance underwriting":
    "Verbotener Zweck: Versicherungsrisikobewertung",
  "Prohibited purpose: employment decisions":
    "Verbotener Zweck: Beschäftigungsentscheidungen",
  "Prohibited purpose: advertising or marketing":
    "Verbotener Zweck: Werbung oder Marketing",
  "Prohibited purpose: harmful or addictive products":
    "Verbotener Zweck: schädliche oder suchterzeugende Produkte",
  "Health data request: approved for anonymised statistics":
    "Datenantrag: genehmigt für anonymisierte Statistiken",
  "Health data access application: justified access to pseudonymised records":
    "Datenzugangsantrag: begründeter Zugang zu pseudonymisierten Daten",
  "Health data access application: downgraded to anonymised statistics":
    "Datenzugangsantrag: herabgestuft auf anonymisierte Statistiken",
  "Unclear purpose: held for staff review":
    "Unklarer Zweck: zur Mitarbeiterprüfung zurückgehalten",
  "Unreadable definitions: held for staff review":
    "Unleserliche Definitionen: zur Mitarbeiterprüfung zurückgehalten",

  // ── article summaries commonly appearing in explanations ────────────────────
  "Article 54 lists the purposes for which secondary use of health data is prohibited.":
    "Artikel 54 listet die Zwecke auf, für die die Sekundärnutzung von Gesundheitsdaten verboten ist.",
  "Article 53 permits secondary use of health data for specified purposes.":
    "Artikel 53 erlaubt die Sekundärnutzung von Gesundheitsdaten für bestimmte Zwecke.",
  "Article 69 governs the provision of anonymised statistics from health data.":
    "Artikel 69 regelt die Bereitstellung anonymisierter Statistiken aus Gesundheitsdaten.",
  "Article 66 sets out the conditions for access to health data in a secure processing environment.":
    "Artikel 66 legt die Bedingungen für den Zugang zu Gesundheitsdaten in einer sicheren Verarbeitungsumgebung fest.",
  "Article 68 sets technical and organisational measures for the secure processing environment.":
    "Artikel 68 legt technische und organisatorische Maßnahmen für die sichere Verarbeitungsumgebung fest.",
  "Article 73 requires logging of all access and use within the secure processing environment.":
    "Artikel 73 schreibt die Protokollierung aller Zugriffe und Nutzungen in der sicheren Verarbeitungsumgebung vor.",
  "Article 71 requires health data access bodies to apply opt-out registries.":
    "Artikel 71 verpflichtet die Zugangsstellen für Gesundheitsdaten zur Anwendung von Widerspruchsregistern.",
};

/**
 * Translate a backend-supplied string to German.
 * Falls back to the English original when no translation is available.
 */
export function translateToDE(text: string): string {
  return REASON_DE[text] ?? text;
}

/**
 * Return the text in the given language.
 * For "en" the text is returned unchanged.
 * For "de" the lookup is applied; untranslated strings stay in English.
 */
export function localizeBackendText(text: string, lang: "en" | "de"): string {
  if (lang === "en") return text;
  return translateToDE(text);
}
