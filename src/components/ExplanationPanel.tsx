import type { AiMemo, DecisionExplanation } from "@/lib/ehds";
import { LegalQuote } from "./LegalQuote";
import type { ReactNode } from "react";
import { useLang, useT } from "@/lib/i18n";
import { localizeBackendText } from "@/lib/i18n/translations";

// Match literal substrings, including repeated and overlapping phrases, without changing the text.
function PurposeHighlight({ text, phrases }: { text: string; phrases: string[] }) {
  const ranges: { start: number; end: number }[] = [];
  for (const phrase of phrases.filter(Boolean)) {
    let start = text.indexOf(phrase);
    while (start !== -1) {
      ranges.push({ start, end: start + phrase.length });
      start = text.indexOf(phrase, start + 1);
    }
  }
  ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: typeof ranges = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start < previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  const content: ReactNode[] = [];
  let offset = 0;
  for (const { start, end } of merged) {
    content.push(text.slice(offset, start));
    content.push(
      <mark key={start} className="rounded-sm bg-accent font-semibold text-accent-foreground">
        {text.slice(start, end)}
      </mark>,
    );
    offset = end;
  }
  content.push(text.slice(offset));
  return <>{content}</>;
}

export function ExplanationPanel({
  explanation,
  purpose,
  question,
  approved = true,
  memo,
}: {
  explanation: DecisionExplanation;
  purpose?: string | undefined;
  question?: string | undefined;
  approved?: boolean;
  memo?: AiMemo | undefined;
}) {
  const t = useT();
  const { lang } = useLang();

  const localRule = localizeBackendText(explanation.rule, lang);

  return (
    <section
      aria-label={t("explanation.heading")}
      className="min-w-0 space-y-4 break-words rounded-lg border border-border p-4"
    >
      <h3 className="font-semibold">{t("explanation.heading")}</h3>
      <div>
        <h4 className="text-sm font-medium">{t("explanation.rule")}</h4>
        <p className="mt-1">{localRule}</p>
        {purpose && (
          <div className="mt-3">
            <h4 className="text-sm font-medium">{t("explanation.requestPurpose")}</h4>
            <p className="mt-1 whitespace-pre-wrap">
              <PurposeHighlight text={purpose} phrases={explanation.trigger_phrases} />
            </p>
          </div>
        )}
        {question && (
          <div className="mt-3">
            <h4 className="text-sm font-medium">{t("explanation.requestQuestion")}</h4>
            <p className="mt-1 whitespace-pre-wrap">
              <PurposeHighlight text={question} phrases={explanation.trigger_phrases} />
            </p>
          </div>
        )}
        {!purpose && !question && !!explanation.trigger_context?.length && (
          <div className="mt-3">
            <h4 className="text-sm font-medium">{t("explanation.matchedContext")}</h4>
            {explanation.trigger_context.map((context, i) => (
              <p key={i} className="mt-1 whitespace-pre-wrap">
                <PurposeHighlight text={context} phrases={explanation.trigger_phrases} />
              </p>
            ))}
          </div>
        )}
      </div>
      {!!explanation.trigger_phrases.length && (
        <div>
          <h4 className="text-sm font-medium">{t("explanation.triggerPhrases")}</h4>
          <ul className="mt-2 space-y-2">
            {explanation.trigger_phrases.map((phrase, i) => (
              <li key={i}>
                <q>{phrase}</q>
              </li>
            ))}
          </ul>
        </div>
      )}
      {approved && explanation.plan_summary && (
        <div>
          <h4 className="text-sm font-medium">{t("explanation.whatWeUnderstood")}</h4>
          <p className="mt-1">
            {explanation.plan_summary}
            {lang === "de" && (
              <span className="text-muted-foreground">{t("explanation.planSuffixEn")}</span>
            )}
          </p>
        </div>
      )}
      {explanation.articles.map((article, i) => (
        <LegalQuote key={`${article.number}-${i}`} article={article} />
      ))}
      {memo && <MemoBlock memo={memo} />}
    </section>
  );
}

function MemoBlock({ memo }: { memo: AiMemo }) {
  const t = useT();
  return (
    <section
      aria-label={t("memo.heading")}
      className="mt-4 space-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm"
    >
      <h4 className="font-semibold">
        {t("memo.heading")}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({t("memo.label")})
        </span>
      </h4>
      <p className="whitespace-pre-wrap">{memo.text}</p>
      {memo.quotes.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {t("memo.quotesHeading")} ({memo.quotes.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {memo.quotes.map((q, i) => (
              <li key={i} className="text-xs">
                <span className="font-mono text-muted-foreground">{q.ref}</span>:{" "}
                <q>{q.text}</q>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
