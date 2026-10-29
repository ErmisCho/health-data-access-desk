import type { LegalArticle } from "@/lib/ehds";

export function LegalQuote({ article }: { article: LegalArticle }) {
  return (
    <figure className="rounded-lg border-l-4 border-accent bg-muted p-4">
      <figcaption className="font-medium">
        <span className="font-mono">
          {article.number.startsWith("Art.") ? article.number : `Art. ${article.number}`}
        </span>{" "}
        · {article.title}
      </figcaption>
      {article.quote && (
        <blockquote className="mt-3 whitespace-pre-wrap text-sm">{article.quote}</blockquote>
      )}
      {article.summary && <p className="mt-3 text-sm text-muted-foreground">{article.summary}</p>}
      {article.ref && (
        <p className="mt-2 break-words font-mono text-xs text-muted-foreground">{article.ref}</p>
      )}
    </figure>
  );
}
