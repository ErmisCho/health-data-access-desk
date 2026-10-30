import type { LegalArticle } from "@/lib/ehds";
import { useLang, useT } from "@/lib/i18n";

export function LegalQuote({ article }: { article: LegalArticle }) {
  const t = useT();
  const { lang } = useLang();
  const start = article.applies ? article.quote.indexOf(article.applies) : -1;
  return (
    <figure className="min-w-0 break-words rounded-lg border-l-4 border-accent bg-muted p-4">
      <figcaption className="font-medium">
        <span className="font-mono">
          {article.ref ||
            (article.number.startsWith("Art.") ? article.number : `Art. ${article.number}`)}
        </span>{" "}
        · {article.title}
        {lang === "de" && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {t("legal.officialLabel")}
          </span>
        )}
      </figcaption>
      {article.quote && (
        <blockquote className="mt-3 whitespace-pre-wrap text-sm">
          {start >= 0 && article.applies ? (
            <>
              {article.quote.slice(0, start)}
              <strong>{article.applies}</strong>
              {article.quote.slice(start + article.applies.length)}
            </>
          ) : (
            article.quote
          )}
        </blockquote>
      )}
      {article.summary && <p className="mt-3 text-sm text-muted-foreground">{article.summary}</p>}
    </figure>
  );
}
