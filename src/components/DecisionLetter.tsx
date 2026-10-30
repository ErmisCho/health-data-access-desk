import { useState } from "react";
import type { DecisionLetter as Letter } from "@/lib/decision-letter";
import { DecisionBadge } from "./DecisionBadge";
import { LifecycleStepper } from "./LifecycleStepper";
import { LegalQuote } from "./LegalQuote";
import { DataTable } from "./DataTable";
import { Button } from "./ui/button";
import { ErrorState } from "./States";
import { useT } from "@/lib/i18n";

export function DecisionLetter({ letter }: { letter: Letter }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      const { buildDecisionLetterPdf } = await import("@/lib/decision-letter-pdf");
      buildDecisionLetterPdf(letter, t).save(`decision-${letter.reference}.pdf`);
    } catch {
      setError(t("letter.pdfError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="decision-letter-page mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <nav
        aria-label="Letter actions"
        className="flex flex-wrap items-center justify-between gap-4 print:hidden"
      >
        <Button asChild variant="outline">
          <a href="/desk">{t("letter.back")}</a>
        </Button>
        <Button onClick={download} disabled={busy}>
          {busy ? t("letter.preparingPdf") : t("letter.downloadPdf")}
        </Button>
      </nav>
      {error && <ErrorState>{error}</ErrorState>}
      <article
        aria-labelledby="letter-title"
        className="decision-letter space-y-8 break-words rounded-lg border border-border bg-card p-6 text-card-foreground sm:p-12 print:border-0 print:p-0"
      >
        <header className="space-y-4 border-b-2 border-primary pb-6">
          <p className="font-display text-xl font-bold">{letter.issuer}</p>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline font-semibold">{t("letter.reference")}</dt>
              <dd className="inline font-mono">{letter.reference}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">{t("letter.date")}</dt>
              <dd className="inline">{letter.date}</dd>
            </div>
          </dl>
          <h1 id="letter-title" className="font-display text-3xl font-bold">
            {t("letter.title")}
          </h1>
        </header>
        <section aria-labelledby="letter-verdict" className="space-y-3">
          <h2 id="letter-verdict" className="text-xl font-semibold">
            {t("letter.verdict.title")}
          </h2>
          <p>{letter.verdict}</p>
          <DecisionBadge decision={letter.decision} />
          <LifecycleStepper
            needsReview={letter.needs_review}
            timeline={letter.timeline}
          />
        </section>
        <section aria-labelledby="letter-why" className="space-y-3">
          <h2 id="letter-why" className="text-xl font-semibold">
            {t("letter.why.title")}
          </h2>
          <p className="whitespace-pre-wrap">{letter.rule}</p>
          {!!letter.triggers.length && (
            <ul className="space-y-2">
              {letter.triggers.map((phrase, i) => (
                <li key={i}>
                  <q>{phrase}</q>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="letter-legal" className="space-y-4">
          <h2 id="letter-legal" className="text-xl font-semibold">
            {t("letter.legal.title")}
          </h2>
          {letter.articles.length ? (
            letter.articles.map((article, i) => <LegalQuote key={i} article={article} />)
          ) : (
            <p>{letter.legalFallback}</p>
          )}
        </section>
        <section aria-labelledby="letter-plan" className="space-y-3">
          <h2 id="letter-plan" className="text-xl font-semibold">
            {t("letter.plan.title")}
          </h2>
          <p>{letter.plan}</p>
        </section>
        <section aria-labelledby="letter-results" className="space-y-3">
          <h2 id="letter-results" className="text-xl font-semibold">
            {t("letter.results.title")}
          </h2>
          {letter.table ? (
            <DataTable caption={t("letter.statResults.caption")}>
              <thead>
                <tr>
                  {letter.table.headers.map((header, i) => (
                    <th scope="col" key={i} className="p-2 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {letter.table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3 font-mono">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <p>{letter.results}</p>
          )}
        </section>
        <section aria-labelledby="letter-conditions" className="space-y-3">
          <h2 id="letter-conditions" className="text-xl font-semibold">
            {t("letter.conditions.title")}
          </h2>
          {letter.conditions.map((condition, i) => (
            <p key={i}>{condition}</p>
          ))}
        </section>
      </article>
    </div>
  );
}
