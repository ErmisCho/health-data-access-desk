/**
 * German UI strings for EHDS Access Desk — Issue #55
 *
 * All keys must match en.ts exactly (enforced by EnDict type below).
 * Language: formal (Sie), standard EHDS-DE terminology.
 */
import type { EnDict } from "./en";

/** All keys from EnDict, values are German strings. */
export const de: { [K in keyof EnDict]: string } = {
  // ── Site header ─────────────────────────────────────────────────────────────
  "nav.home": "EHDS Access Desk",
  "nav.register": "Transparenzregister",
  "nav.howWeDecide": "Wie wir entscheiden",
  "nav.examples": "Beispiele",
  "nav.openDesk": "Zum Desk",
  "nav.langToggle.de": "DE",
  "nav.langToggle.en": "EN",
  "nav.langToggle.switchTo.de": "Auf Deutsch wechseln",
  "nav.langToggle.switchTo.en": "Switch to English",
  "nav.mainNav": "Hauptnavigation",

  // ── Landing page ─────────────────────────────────────────────────────────────
  "landing.eyebrow": "EHDS Kapitel IV · Sekundärnutzung",
  "landing.hero": "Kann dieser Gesundheitsdatenantrag genehmigt werden?",
  "landing.heroSub":
    "Wandeln Sie einen Antrag in ein klares, einheitliches Ergebnis mit zitierten Rechtsgrundlagen und Datenschutzgarantien um.",
  "landing.cta.submit": "Antrag einreichen",
  "landing.cta.examples": "Beispiele ansehen",
  "landing.cta.howWeDecide": "Wie wir entscheiden",
  "landing.chip.legalBasis": "Rechtsgrundlage zitiert",
  "landing.chip.noPatientData": "Keine Patientendaten verlassen das System",
  "landing.chip.sameAnswer": "Jederzeit dieselbe Antwort",
  "landing.whatYouGet.title": "Was Sie erhalten",
  "landing.whatYouGet.item1.title": "Eine nachvollziehbare Entscheidung",
  "landing.whatYouGet.item1.text":
    "Ein begründetes Schreiben mit den rechtlichen Artikeln hinter dem Ergebnis.",
  "landing.whatYouGet.item2.title": "Ein geschützter Weg zu den Daten",
  "landing.whatYouGet.item2.text":
    "Anonymisierte Statistiken oder gesicherter Zugang zu pseudonymisierten Daten, wo genehmigt.",
  "landing.whatYouGet.item3.title": "Eine klare Übergabe an das Personal",
  "landing.whatYouGet.item3.text":
    "Unklare Anträge werden vor einer endgültigen Entscheidung zur Prüfung zurückgehalten.",
  "landing.howItWorks.title": "So funktioniert es",
  "landing.steps.list": "So funktioniert es",
  "landing.step1.title": "Antrag beschreiben",
  "landing.step1.text":
    "Geben Sie Zweck, benötigte Daten und gewünschtes Ergebnis an. Unklare Anträge werden zur Mitarbeiterprüfung zurückgehalten.",
  "landing.step2.title": "Zweck prüfen",
  "landing.step2.text":
    "Regeln prüfen den Zweck anhand von EHDS Kapitel IV, einschließlich zulässiger Verwendungen und der verbotenen Zwecke in Artikel 54.",
  "landing.step3.title": "Begründetes Ergebnis erhalten",
  "landing.step3.text":
    "Erhalten Sie einen Bescheid und – soweit genehmigt – anonymisierte Statistiken oder einen Weg in eine sichere Verarbeitungsumgebung.",
  "landing.proof.eyebrow": "Gemessen, mit Einschränkungen",
  "landing.proof.title": "Geprüft vor dem nächsten Antrag",
  "landing.proof.stat1.value": "10/10",
  "landing.proof.stat1.label": "Beispielentscheidungen korrekt",
  "landing.proof.stat2.value": "6/6",
  "landing.proof.stat2.label": "Statistikprüfungen korrekt",
  "landing.proof.stat3.value": "0",
  "landing.proof.stat3.label": "Datenlecks in Stichprobentests",
  "landing.proof.stat4.value": "42",
  "landing.proof.stat4.label": "Jury-Testanträge: 0 falsche Entscheidungen, 0 Datenlecks",
  "landing.proof.disclaimer":
    "Gemessen am 30. Oktober 2026 mit dem Live-Backend, mit einheitlichen Ergebnissen über drei Durchläufe. Dies sind Testanträge, keine Aussage über die Leistung bei realen Anträgen oder Garantie für zukünftige Ergebnisse.",
  "landing.aiDisclosure.title": "Regeln entscheiden.\nMenschen bleiben verantwortlich.",
  "landing.aiDisclosure.p1":
    "Deterministische Regeln bestimmen das Ergebnis, ein festes Programm berechnet die Statistiken. Heute wird keine KI eingesetzt. Falls später aktiviert, kann KI Ergebnisse nur strenger machen. Patientendaten gelangen nie zur KI.",
  "landing.aiDisclosure.callout":
    "Dies ist Entscheidungsunterstützung für Mitarbeitende der Zugangsstelle für Gesundheitsdaten (HDAB). Die endgültige Entscheidung liegt bei der HDAB.",
  "landing.faq.title": "Bevor Sie beginnen",
  "landing.faq.privacy.title": "Was passiert mit Daten und Datenschutz?",
  "landing.faq.privacy.text":
    "Patientenakten verbleiben in der geschützten Verarbeitungsumgebung. Patientendaten gelangen nie zur KI. Patienten mit Widerspruch werden ausgeschlossen. Statistiken verwenden Unterdrückung kleiner Zellen: Werte unter 10 werden als \u201E<10\u201C angezeigt. Genehmigter Zugang zu pseudonymisierten Daten erfolgt in einer sicheren Verarbeitungsumgebung, ohne Export von Patientenakten.",
  "landing.faq.legal.title": "Was ist die Rechtsgrundlage?",
  "landing.faq.legal.text":
    "Der Desk prüft Anträge auf Sekundärnutzung gemäß Verordnung (EU) 2025/327, Kapitel IV. Artikel 54 regelt verbotene Zwecke. Die Artikel 53 und 69 stützen den Statistikweg; die Artikel 53, 66, 68 und 73 regeln den Weg der sicheren Verarbeitungsumgebung. Jedes Ergebnis zitiert die relevanten Artikel, damit das Personal die Begründung nachvollziehen kann.",
  "landing.faq.decisions.title": "Wie werden Entscheidungen getroffen?",
  "landing.faq.decisions.text":
    "Deterministische Regeln bewerten den Antrag. Verbotene Zwecke werden abgelehnt; zulässige Anträge können anonymisierte Statistiken erhalten oder in eine sichere Verarbeitungsumgebung geleitet werden. Ein festes Programm berechnet die Statistiken. Unklare Fälle werden zur Mitarbeiterprüfung zurückgehalten. Derselbe Antrag unter denselben Regeln und Daten liefert immer dieselbe Antwort. Die HDAB trifft die endgültige Entscheidung.",
  "landing.footer.credit": "EHDS Access Desk · Zugangsstelle für Gesundheitsdaten (HDAB)",
  "landing.footer.openDesk": "Zum Desk",
  "landing.footer.privacy": "Datenschutz und Rechtsgrundlage",
  "landing.footer.aiDisclosure": "KI-Offenlegung",

  // ── Enum labels for requested_as / requested_format ─────────────────────────
  "enum.requestedAs.healthDataRequest": "Datenantrag",
  "enum.requestedAs.healthDataAccessApplication": "Datenzugangsantrag",
  "enum.requestedFormat.anonymisedStatistics": "anonymisierte Statistik",
  "enum.requestedFormat.pseudonymisedRecords": "pseudonymisierte Daten",

  // ── Desk page ────────────────────────────────────────────────────────────────
  "desk.eyebrow": "Zugangsstelle für Gesundheitsdaten (HDAB) · EHDS",
  "desk.heading": "EHDS Access Desk",
  "desk.role.applicant": "Antragsteller:in",
  "desk.role.staff": "Personal",
  "desk.role.demo": "Demo",
  "desk.roleLabel": "Ansicht",
  "desk.applicant.heading": "Datenzugangsantrag",
  "desk.tab.guided": "Geführt",
  "desk.tab.json": "JSON",
  "desk.inputMode": "Eingabemodus",
  "desk.decision.heading": "Entscheidung",

  // ── GuidedForm ───────────────────────────────────────────────────────────────
  "form.loadSample": "Beispiel laden",
  "form.chooseSample": "— Beispiel auswählen —",
  "form.importJson": "JSON importieren",
  "form.exportJson": "JSON exportieren",
  "form.pasteOrUpload": "JSON einfügen oder Datei hochladen",
  "form.apply": "Übernehmen",
  "form.uploadFile": "Datei hochladen",
  "form.importMustBeObject": "Der Import muss ein JSON-Objekt sein.",
  "form.couldNotParseJson": "JSON konnte nicht gelesen werden. Bitte gültiges JSON einfügen.",
  "form.step1": "Antragsteller:in",
  "form.step2": "Antragstyp",
  "form.step3": "Zweck",
  "form.step4": "Frage",
  "form.step5": "Definitionen",
  "form.step6": "Prüfen & einreichen",
  "form.steps.aria": "Formularschritte",
  "form.applicant.legend": "Antragsteller:in",
  "form.applicant.name": "Name",
  "form.applicant.org": "Organisation",
  "form.applicant.country": "Land (ISO-2-Buchstabencode)",
  "form.requestType.legend": "Antragstyp",
  "form.requestType.requestedAs": "Eingereicht als",
  "form.requestType.healthDataRequest": "Datenantrag (health data request)",
  "form.requestType.healthDataAccessApplication":
    "Datenzugangsantrag (health data access application)",
  "form.requestType.requestedFormat": "Angefordertes Format",
  "form.requestType.anonymisedStatistics": "Anonymisierte Statistik",
  "form.requestType.pseudonymisedRecords": "Pseudonymisierte Daten",
  "form.purpose.legend": "Zweck",
  "form.purpose.label": "Warum benötigen Sie diese Daten?",
  "form.purpose.placeholder":
    "Beschreiben Sie den wissenschaftlichen oder öffentlich-gesundheitlichen Zweck Ihres Antrags.",
  "form.question.legend": "Frage",
  "form.question.label": "Was ist Ihre Forschungsfrage?",
  "form.question.placeholder":
    "Formulieren Sie die konkrete Frage, die die Daten beantworten sollen.",
  "form.definitions.legend": "Definitionen",
  "form.definitions.hint":
    "Fügen Sie eine Definition pro Zeile hinzu. Jede Definition gibt Kohortenkriterien, Altersgruppen, Medikamente oder das Berichtsformat an.",
  "form.definitions.ariaLabel": "Definitionsliste",
  "form.definitions.placeholder": "Definition",
  "form.definitions.add": "+ Definition hinzufügen",
  "form.definitions.remove": "Definition entfernen",
  "form.review.legend": "Prüfen & einreichen",
  "form.review.applicant": "Antragsteller:in",
  "form.review.organisation": "Organisation",
  "form.review.country": "Land",
  "form.review.requestedAs": "Eingereicht als",
  "form.review.format": "Format",
  "form.review.purpose": "Zweck",
  "form.review.question": "Frage",
  "form.review.definitions": "Definitionen",
  "form.back": "← Zurück",
  "form.next": "Weiter →",
  "form.submitting": "Wird eingereicht …",
  "form.submit": "Antrag einreichen",
  "form.livePreview": "Live-Vorschau",
  "form.weUnderstood": "So verstehen wir den Antrag",
  "form.weUnderstood.plan": "Plan: ",
  "form.weUnderstood.staffReview": "Dieser Antrag würde zur Mitarbeiterprüfung zurückgehalten.",
  "form.emptyPreview":
    "Füllen Sie Zweck, Frage und Definitionen aus, um zu sehen, wie das System Ihren Antrag versteht.",
  "form.requestFailed": "Anfrage fehlgeschlagen. Bitte versuchen Sie es erneut.",
  "form.evaluating": "Wird ausgewertet …",
  "form.sampleRequest": "Beispielantrag",
  "form.runSample": "Beispielantrag ausführen",

  // ── DecisionDetails ──────────────────────────────────────────────────────────
  "decision.viewLetter": "Bescheid anzeigen",
  "decision.needsReview": "Mitarbeiterprüfung erforderlich",
  "decision.citedArticles": "Zitierte Artikel",
  "decision.reason": "Begründung",
  "decision.eligiblePatients": "Berechtigte Patienten:",
  "decision.definitionsNeedReview": "Überprüfungsbedürftige Definitionen",
  "decision.cohortSize": "Kohortengröße:",
  "decision.notProvided": "Nicht angegeben",
  "decision.secureEnv": "Sichere Verarbeitungsumgebung",
  "decision.speSchema": "Schema:",
  "decision.downloadsBlocked": "· Downloads gesperrt",
  "decision.provisioningNotProvided": "Bereitstellungsstatus nicht angegeben",
  "decision.notApplicable": "Nicht anwendbar",
  "decision.notRequired": "Nicht erforderlich",
  "decision.checking": "Wird geprüft …",
  "decision.download": "Herunterladen",

  // ── DecisionBadge ────────────────────────────────────────────────────────────
  "badge.REJECT": "Abgelehnt",
  "badge.APPROVE_STATISTICAL": "Genehmigt für Statistik",
  "badge.APPROVE_SPE": "Genehmigt für sichere Verarbeitung",

  // ── LifecycleStepper ─────────────────────────────────────────────────────────
  "lifecycle.Submitted": "Eingereicht",
  "lifecycle.Assessed": "Bewertet",
  "lifecycle.StaffReview": "Mitarbeiterprüfung",
  "lifecycle.Decided": "Entschieden",
  "lifecycle.Fulfilled": "Ausgeführt",
  "lifecycle.status.complete": "Abgeschlossen",
  "lifecycle.status.current": "Aktuell",
  "lifecycle.status.pending": "Ausstehend",
  "lifecycle.aria": "Antragsverlauf",

  // ── ExplanationPanel ─────────────────────────────────────────────────────────
  "explanation.heading": "Entscheidungsbegründung",
  "explanation.rule": "Regel:",
  "explanation.requestPurpose": "Antragszweck",
  "explanation.requestQuestion": "Antragsfrage",
  "explanation.matchedContext": "Übereinstimmender Antragskontext",
  "explanation.triggerPhrases": "Auslösende Begriffe",
  "explanation.whatWeUnderstood": "So verstehen wir den Antrag",
  "explanation.planSuffixEn": " (Englisch)",

  // ── LegalQuote ───────────────────────────────────────────────────────────────
  "legal.officialLabel":
    "Amtlicher Wortlaut (Englisch), Verordnung (EU) 2025/327",

  // ── DecisionLetter ───────────────────────────────────────────────────────────
  "letter.back": "Zurück zum Desk",
  "letter.downloadPdf": "PDF herunterladen",
  "letter.preparingPdf": "PDF wird erstellt …",
  "letter.pdfError":
    "Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
  "letter.reference": "Aktenzeichen: ",
  "letter.date": "Datum: ",
  "letter.title": "Bescheid",
  "letter.verdict.title": "Ergebnis",
  "letter.why.title": "Begründung",
  "letter.legal.title": "Rechtsgrundlage",
  "letter.plan.title": "Was wir gezählt haben",
  "letter.results.title": "Ergebnisse",
  "letter.conditions.title": "Auflagen und nächste Schritte",
  "letter.statResults.caption": "Statistische Ergebnisse",

  // ── decision-letter.ts verdicts / conditions ─────────────────────────────────
  "letter.verdict.REJECT": "Antrag abgelehnt",
  "letter.verdict.APPROVE_STATISTICAL": "Genehmigt für statistische Ergebnisse",
  "letter.verdict.APPROVE_SPE":
    "Genehmigt für den Zugang in einer sicheren Verarbeitungsumgebung",
  "letter.verdict.held": "Wartet auf Mitarbeiterprüfung — Entscheidung zurückgehalten",
  "letter.legalFallback.noQuotes":
    "Verbatim-Rechtszitate wurden mit dieser Entscheidung nicht bereitgestellt.",
  "letter.legalFallback.none":
    "Die Rechtsgrundlage wurde mit dieser Entscheidung nicht angegeben.",
  "letter.plan.noData": "Keine Daten gezählt oder freigegeben.",
  "letter.plan.notProvided":
    "Der Zählplan wurde mit dieser Entscheidung nicht bereitgestellt.",
  "letter.results.noData": "Keine Daten freigegeben.",
  "letter.results.cohort": "Kohortengröße:",
  "letter.results.noStats": "Keine statistischen Ergebnisse verfügbar.",
  "letter.conditions.awaiting":
    "Wartet auf Mitarbeiterprüfung. Kein Zugang und keine Datenfreigabe bis zum Abschluss der Prüfung.",
  "letter.conditions.reject":
    "Keine Daten freigegeben. Die Beschränkung für verbotene Nutzung gilt gemäß Art. 54.",
  "letter.conditions.spe":
    "Zugang nur innerhalb der sicheren Verarbeitungsumgebung; kein Download von Patientendaten auf Einzelebene. Art. 73 gilt.",
  "letter.conditions.stats":
    "Nur für den angegebenen Zweck verwenden. Kleine Zellen werden zum Schutz der Privatsphäre unterdrückt.",
  "letter.issuer": "Zugangsstelle für Gesundheitsdaten (HDAB)",

  // ── ResultsTable ─────────────────────────────────────────────────────────────
  "results.metric.adults": "Erwachsene",
  "results.metric.copd_patients": "Personen mit COPD",
  "results.metric.inpatient_stays_copd": "Stationäre Aufenthalte wegen COPD",
  "results.metric.adults_with_t2d": "Erwachsene mit Typ-2-Diabetes",
  "results.metric.type2_diabetes": "Erwachsene mit Typ-2-Diabetes",
  "results.metric.prevalence_pct": "Prävalenz (%)",
  "results.metric.af_patients": "Personen mit Vorhofflimmern",
  "results.metric.without_oac": "Personen ohne orale Antikoagulation",
  "results.metric.share_without_oac_pct": "Ohne orale Antikoagulation (%)",
  "results.metric.adults_with_hypertension": "Erwachsene mit Bluthochdruck",
  "results.metric.ace_inhibitor_pct": "ACE-Hemmer-Einnahme (%)",
  "results.metric.arb_pct": "Angiotensin-Rezeptorblocker-Einnahme (%)",
  "results.metric.patients_with_hba1c": "Personen mit HbA1c-Messungen",
  "results.metric.mean_hba1c": "Mittlerer HbA1c-Wert",
  "results.metric.patients_with_sglt2": "Personen mit SGLT2-Hemmern",
  "results.metric.cohort_size": "Kohortengröße",
  "results.metric.inpatient_stays": "Stationäre Aufenthalte",
  "results.metric.women_with_bmi": "Frauen mit BMI-Messungen",
  "results.metric.mean_bmi": "Mittlerer BMI",
  "results.metric.count": "Anzahl",
  "results.metric.value": "Wert",
  "results.metric.cohort": "Kohorte",
  "results.metric.subset": "Teilgruppe",
  "results.metric.percentage": "Prozentanteil",
  "results.showPercentages": "Prozentspaltenspalten anzeigen",
  "results.yes": "Ja",
  "results.no": "Nein",
  "results.group": "Gruppe",
  "results.groupN": "Gruppe",
  "results.noStats": "Keine statistischen Ergebnisse verfügbar.",

  // ── Page titles (document.title) ─────────────────────────────────────────────
  "page.title.home": "EHDS Access Desk \u2014 Kann dieser Gesundheitsdatenantrag genehmigt werden?",
  "page.title.desk": "EHDS Access Desk \u2014 Zugangsstelle f\u00FCr Gesundheitsdaten (HDAB)",
  "page.title.letter": "Bescheid \u2014 EHDS Access Desk",
  "page.title.howWeDecide": "Wie wir entscheiden \u00B7 EHDS Access Desk",
  "page.title.examples": "Beispielantr\u00E4ge \u00B7 EHDS Access Desk",
  "page.title.register": "Transparenzregister \u00B7 EHDS Access Desk",

  // ── PDF headings ─────────────────────────────────────────────────────────────
  "pdf.heading.verdict": "Ergebnis",
  "pdf.heading.why": "Begründung",
  "pdf.heading.legalBasis": "Rechtsgrundlage",
  "pdf.heading.whatWeCounted": "Was wir gezählt haben",
  "pdf.heading.results": "Ergebnisse",
  "pdf.heading.conditions": "Auflagen und nächste Schritte",
  "pdf.label.reference": "Aktenzeichen: ",
  "pdf.label.date": "Datum: ",

  // ── HowWeDecide ──────────────────────────────────────────────────────────────
  "hwd.eyebrow": "Methodik · 30. Oktober 2026",
  "hwd.title": "Wie wir entscheiden",
  "hwd.intro":
    "Zunächst wird der Zweck geprüft, dann die am wenigsten detaillierten Daten ermittelt, die zur Beantwortung des Antrags notwendig sind. Diese Regeln unterstützen die Mitarbeitenden der Zugangsstelle für Gesundheitsdaten (HDAB), die für die endgültige Entscheidung verantwortlich bleiben.",
  "hwd.order.title": "Entscheidungsreihenfolge",
  "hwd.order.item1.title": "Verbotene Zwecke zuerst ablehnen",
  "hwd.order.item1.text":
    "Artikel 54 hat Vorrang. Versicherungsprämien und Beschäftigungsentscheidungen sind nach Art. 54 Abs. 1 Buchst. b verboten; Werbung und Marketing nach Art. 54 Abs. 1 Buchst. c; schädliche Produkte wie Tabak und Nikotin nach Art. 54 Abs. 1 Buchst. d. Das Ergebnis ist ABGELEHNT.",
  "hwd.order.item2.title":
    "Ein Datenantrag erhält anonymisierte Statistiken",
  "hwd.order.item2.text":
    "Für einen zulässigen Zweck folgt ein Datenantrag dem Statistikweg gemäß Art. 53 und 69.",
  "hwd.order.item3.title":
    "Begründete Datenzugangsanträge nutzen eine sichere Verarbeitungsumgebung",
  "hwd.order.item3.text":
    "Ein Datenzugangsantrag muss begründen, warum anonymisierte Daten nicht ausreichen. Mit dieser Begründung erhält er pseudonymisierte Daten in einer sicheren Verarbeitungsumgebung gemäß Art. 53, 66, 68 und 73.",
  "hwd.order.item4.title":
    "Andere Datenzugangsanträge erhalten anonymisierte Statistiken",
  "hwd.order.item4.text":
    "Ohne Begründung für Einzeldatensätze wird ein Datenzugangsantrag auf anonymisierte Statistiken herabgestuft gemäß Art. 53, 66 Abs. 2 und 69, auch wenn Datensätze beantragt wurden.",
  "hwd.order.note":
    "Verneinte Formulierungen wie \u201EWir werden dies nicht für Werbung verwenden\u201C lösen keine Regel aus. Unklare Zwecke oder unleserliche Definitionen werden zur Mitarbeiterprüfung zurückgehalten. Das Personal genehmigt oder überschreibt mit einem schriftlichen Grund, der im Prüfungsprotokoll festgehalten wird. Dieselben Schutzmaßnahmen gelten weiterhin.",
  "hwd.rules.title": "Versionierte Regeln und Rechtstexte",
  "hwd.rules.text":
    "Die Regeln sind in decision_rules.json, Version 1.0.1, mit 14 Regeln enthalten. Jede Entscheidung erfasst die Regel-ID und die Regelversion.",
  "hwd.rules.quotes":
    "Rechtszitate sind Originaltext aus der Verordnung (EU) 2025/327. Alle 42 gespeicherten Absätze wurden Wort für Wort mit dem offiziellen Text abgeglichen.",
  "hwd.statistics.title": "Statistiken und die Unterdrückungsregel",
  "hwd.statistics.text":
    "Ein festes Programm berechnet Statistiken anhand der Definitionen des Antrags. Werte unter 10 werden als \u201E<10\u201C angezeigt. Prozentsätze oder Mittelwerte, die auf weniger als 10 Personen basieren, werden als \u201Eunterdrückt\u201C angezeigt.",
  "hwd.optouts.title": "Umgang mit Widersprüchen",
  "hwd.optouts.text":
    "Patienten, die widersprochen haben, werden vor jeder Zählung entfernt. Jede Zählung beginnt bei der berechtigten Population (19.161 synthetische Patienten). Widerspruchsanzahlen werden nie angezeigt.",
  "hwd.secure.title": "Sichere Verarbeitung und gesperrte Downloads",
  "hwd.secure.text":
    "Nur die pseudonymisierten Datensätze der im Antrag genannten Kohorte werden in die sichere Verarbeitungsumgebung kopiert. Downloads werden mit HTTP 403 gesperrt und gemäß Art. 73 protokolliert.",
  "hwd.testing.title": "Tests: Auswertung und Jury-Simulation",
  "hwd.testing.measured": "Gemessen am 30. Oktober 2026.",
  "hwd.testing.sample.dt": "10 Beispielanträge",
  "hwd.testing.sample.dd":
    "10/10 Entscheidungen korrekt; 6/6 Zahlenwerte korrekt; 0 Datenlecks; dieselbe Antwort in 3 Durchläufen.",
  "hwd.testing.jury.dt": "42 Jury-Testanträge",
  "hwd.testing.jury.dd":
    "0 falsche Entscheidungen; 0 Datenlecks; 13 verbotene Zwecke abgelehnt.",
  "hwd.testing.disclaimer":
    "Dies sind Testanträge mit synthetischen Daten, keine realen Anträge. Die Messungen beschreiben diese Tests und garantieren keine Ergebnisse für zukünftige Anträge.",
  "hwd.ai.title": "Die Rolle von KI",
  "hwd.ai.text":
    "Heute entscheidet keine KI. Ein optionaler KI-Schritt darf Ergebnisse nur strenger machen und sieht keine Patientendaten.",
  "hwd.explore": "Die 10 Beispielanträge erkunden",

  // ── ExamplesGallery ──────────────────────────────────────────────────────────
  "examples.title": "Beispielanträge",
  "examples.intro":
    "Zehn Beispielanträge mit synthetischen Daten. Karten zeigen erwartete Entscheidungen, gemessen am 30. Oktober 2026. Öffnen Sie eine Karte, um den Originalantrag einzureichen und das vollständige Live-Ergebnis zu prüfen.",
  "examples.howWeDecide": "Wie wir entscheiden",
  "examples.ariaList": "Beispielanträge",
  "examples.open": "Öffnen",
  "examples.applicantType": "Antragstyp:",
  "examples.expectedDecision": "Erwartete Entscheidung",
  "examples.openFull": "Vollständiges Live-Ergebnis öffnen",
  "examples.result.title": "Vollständiges Live-Ergebnis",
  "examples.result.loading": "Laden",
  "examples.result.liveResult": "· Live-Ergebnis",
  "examples.result.from": "vom Live-Backend …",
  "examples.result.choose":
    "Wählen Sie einen Beispielantrag aus, um die Entscheidung, zitierten Artikel und verfügbare Antwort zu prüfen.",
  "examples.result.tryAgain": "Erneut versuchen",
  "examples.result.purpose": "Zweck:",

  // ── TransparencyRegister ─────────────────────────────────────────────────────
  "register.title": "Transparenzregister",
  "register.intro":
    "Dieses öffentliche Register listet bis zu 100 der neuesten beschiedenen Anträge auf, neueste zuerst. Wir veröffentlichen ein Aktenzeichen, das Einreichungsdatum, den Organisationstyp, die Zweckkategorie, die Entscheidung und die relevanten EHDS-Artikel. Anträge, die auf Prüfung warten, sind ausgeschlossen.",
  "register.privacy":
    "Wir lassen bewusst persönliche und Organisationsnamen, ursprüngliche Antragskennungen, Freitext-Zwecke und -Fragen sowie alle Patientendaten, Antworten und Kohortengrößen weg. Aktenzeichen identifizieren nur Registereinträge; Kategorien verwenden Standardbezeichnungen.",
  "register.filterLabel": "Nach Entscheidung filtern",
  "register.all": "Alle Entscheidungen",
  "register.rejected": "Abgelehnt",
  "register.approvedStats": "Genehmigt für Statistik",
  "register.approvedSpe": "Genehmigt für sichere Verarbeitung",
  "register.loading": "Entscheidungen werden geladen …",
  "register.loadError":
    "Das Register konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
  "register.tryAgain": "Erneut versuchen",
  "register.count.singular": "Entscheidung angezeigt",
  "register.count.plural": "Entscheidungen angezeigt",
  "register.empty.noDecisions": "Noch keine beschiedenen Anträge veröffentlicht.",
  "register.empty.noMatch": "Keine Entscheidungen entsprechen diesem Filter.",
  "register.caption": "Öffentliche Entscheidungen, neueste Einreichung zuerst",
  "register.col.reference": "Aktenzeichen",
  "register.col.submissionDate": "Einreichungsdatum",
  "register.col.orgType": "Organisationstyp",
  "register.col.purposeCategory": "Zweckkategorie",
  "register.col.decision": "Entscheidung",
  "register.col.articles": "Artikel",
  "register.ariaPublished": "Veröffentlichte Entscheidungen",

  // ── StaffHistory ─────────────────────────────────────────────────────────────
  "staff.pastRequests": "Bisherige Anträge",
  "staff.refreshHistory": "Verlauf aktualisieren",
  "staff.loading": "Verlauf wird geladen …",
  "staff.loadError": "Verlauf konnte nicht geladen werden:",
  "staff.queue.heading": "Prüfwarteschlange",
  "staff.queue.awaiting": "warten auf Prüfung",
  "staff.queue.empty": "Keine Anträge warten auf Prüfung.",
  "staff.queue.awaitingBadge": "Wartet auf Mitarbeiterprüfung",
  "staff.review.heading": "Antrag prüfen",
  "staff.review.approve": "Genehmigen (Pipeline-Entscheidung beibehalten)",
  "staff.review.override": "Entscheidung überschreiben",
  "staff.review.overrideLabel": "Entscheidung überschreiben",
  "staff.review.reason": "Begründung",
  "staff.review.reasonRequired": "(erforderlich)",
  "staff.review.reasonPlaceholder": "Erläutern Sie die Grundlage dieser Entscheidung …",
  "staff.review.staffName": "Name des/der Mitarbeitenden",
  "staff.review.staffNamePlaceholder": "Ihr Name für das Prüfungsprotokoll",
  "staff.review.submitting": "Wird eingereicht …",
  "staff.review.approveBtn": "Genehmigen",
  "staff.review.overrideBtn": "Überschreiben",
  "staff.history.caption": "Einreichungsverlauf",
  "staff.col.request": "Antrag",
  "staff.col.savedAt": "Gespeichert um",
  "staff.col.decision": "Entscheidung",
  "staff.col.review": "Prüfung",
  "staff.col.secureEnv": "Sichere Verarbeitungsumgebung",
  "staff.col.result": "Ergebnis",
  "staff.row.awaitingReview": "Wartet auf Mitarbeiterprüfung",
  "staff.row.reviewedBy": "Geprüft von",
  "staff.row.noReview": "Keine Prüfung erforderlich",
  "staff.row.speInfo": "· Downloads gesperrt",
  "staff.row.noSpe": "Keine sichere Verarbeitungsumgebung erfasst",
  "staff.row.viewResult": "Neuestes Ergebnis für",
  "staff.detail.title": "Neuestes gespeichertes Ergebnis —",
  "staff.detail.note":
    "Bei mehrfach vorhandenen Antrags-IDs wird die neueste gespeicherte Antwort angezeigt.",
  "staff.detail.loading": "Gespeichertes Ergebnis wird geladen …",
  "staff.detail.loadError": "Gespeichertes Ergebnis konnte nicht geladen werden:",
  "staff.audit.heading": "Prüfungsprotokoll",
  "staff.audit.caption": "Prüfungsprotokoll (Personal)",
  "staff.audit.col.who": "Wer",
  "staff.audit.col.request": "Antrag",
  "staff.audit.col.action": "Aktion",
  "staff.audit.col.decision": "Entscheidung",
  "staff.audit.col.reason": "Begründung",
  "staff.audit.col.when": "Wann",
  "staff.audit.empty": "Keine Mitarbeiteraktionen erfasst.",
  "staff.download.heading": "Protokoll gesperrter Downloads",
  "staff.download.caption": "Gesperrte Download-Versuche",
  "staff.download.col.request": "Antrag",
  "staff.download.col.attemptedAt": "Versuchszeitpunkt",
  "staff.download.col.status": "Status",
  "staff.download.blocked": "Gesperrt",
  "staff.download.empty": "Keine gesperrten Download-Versuche erfasst.",
  "staff.noRequests": "Keine gespeicherten Anträge.",

  // ── DemoPanel ────────────────────────────────────────────────────────────────
  "demo.proof.heading": "Nachweis",
  "demo.proof.text":
    "Gemessen am 30. Okt. 2026 mit dem Live-Backend: 10/10 Beispielentscheidungen · 6/6 Zahlenwerte · 0 Datenlecks · einheitlich über 3 Durchläufe · 42 Jury-Anfragen, 0 falsche Entscheidungen, 0 Datenlecks, 13 verbotene Zwecke abgelehnt",
  "demo.proof.disclaimer": "Testanträge, keine realen Anträge.",
  "demo.heading": "Zwei-Minuten-Demo",
  "demo.intro":
    "In Präsentationsreihenfolge ausführen. Jeder Klick sendet den Originalantrag an das Live-Backend.",
  "demo.anyRequest": "Beliebiger Beispielantrag",
  "demo.run": "Beispielantrag ausführen",
  "demo.running": "Ausführen",
  "demo.onBackend": "auf dem Backend …",
  "demo.result.heading": "Live-Ergebnis",
  "demo.pointAt.heading": "Worauf zeigen",
  "demo.requested": "Angefordert:",
  "demo.optouts.note":
    "Art. 71: Berechtigte Patienten ist die Backend-Populationsanzahl. Quellseitige Ausschlüsse basieren auf Abfragen, die von eligible_patients vor Kohortenfiltern und Aggregation ausgehen; diese Zahl allein ist kein Widerspruchsprüfbericht. Die zitierten Entscheidungsartikel bleiben unten.",
  "demo.empty": "Wählen Sie ein Szenario aus, um die Live-Entscheidung und den Nachweis zu sehen.",
  "demo.disclaimer":
    "Prototyp mit synthetischen Daten · regelbasierter Parser mit eingeschränkter Sprachunterstützung · Personalwechsel ohne Produktionsauthentifizierung.",
  "demo.scenario.purpose": "Ablehnung nach Art. 54",
  "demo.scenario.statistics": "Statistik mit Zahlen",
  "demo.scenario.optOuts": "Patienten mit Widerspruch ausgeschlossen",
  "demo.scenario.smallCells": "Unterdrückung kleiner Zellen",
  "demo.scenario.spe": "Sichere Verarbeitungsumgebung",
  "demo.scenario.download": "Gesperrter Download",
  "demo.scenario.downgrade": "Datensätze auf Statistik herabgestuft",
} as const;
