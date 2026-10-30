import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { getRequest } from "@/lib/ehds";
import { createDecisionLetter } from "@/lib/decision-letter";
import { EmptyState, ErrorState } from "@/components/States";
import { useT, useLang } from "@/lib/i18n";

const DecisionLetter = lazy(() =>
  import("@/components/DecisionLetter").then((m) => ({ default: m.DecisionLetter })),
);

export const Route = createFileRoute("/desk_/letter/$requestId")({
  loader: async ({ params }) => getRequest(params.requestId),
  head: () => ({ meta: [{ title: "Decision letter — EHDS Access Desk" }] }),
  pendingComponent: () => <EmptyState title="Loading decision letter…" />,
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-4xl p-6">
      <ErrorState>The decision letter could not be loaded.</ErrorState>
      <button onClick={reset} className="underline">
        Try again
      </button>{" "}
      ·{" "}
      <a href="/desk" className="underline">
        Back to desk
      </a>
    </div>
  ),
  component: LetterPage,
});

function LetterPage() {
  const result = Route.useLoaderData();
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "de" ? "de-AT" : "en-GB";
  const letter = createDecisionLetter(result, new Date(), t, locale);
  useEffect(() => { document.title = t("page.title.letter"); }, [t]);
  return (
    <Suspense fallback={<EmptyState title="Loading decision letter…" />}>
      <DecisionLetter letter={letter} />
    </Suspense>
  );
}
