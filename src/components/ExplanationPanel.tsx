import type { DecisionExplanation } from "@/lib/ehds";
import { LegalQuote } from "./LegalQuote";

export function ExplanationPanel({ explanation }: { explanation: DecisionExplanation }) {
  return (
    <section
      aria-label="Decision explanation"
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <h3 className="font-semibold">Decision explanation</h3>
      <div>
        <h4 className="text-sm font-medium">Rule</h4>
        <p className="mt-1">{explanation.rule}</p>
      </div>
      {!!explanation.trigger_phrases.length && (
        <div>
          <h4 className="text-sm font-medium">Trigger phrases</h4>
          <ul className="mt-2 space-y-2">
            {explanation.trigger_phrases.map((phrase, i) => (
              <li key={i}>
                <q>{phrase}</q>
              </li>
            ))}
          </ul>
        </div>
      )}
      {explanation.plan_summary && (
        <div>
          <h4 className="text-sm font-medium">What we understood</h4>
          <p className="mt-1">{explanation.plan_summary}</p>
        </div>
      )}
      {explanation.articles.map((article, i) => (
        <LegalQuote key={`${article.number}-${i}`} article={article} />
      ))}
    </section>
  );
}
