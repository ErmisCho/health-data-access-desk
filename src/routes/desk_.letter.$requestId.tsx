import { createFileRoute } from "@tanstack/react-router";
import { getRequest } from "@/lib/ehds";
import { createDecisionLetter } from "@/lib/decision-letter";
import { DecisionLetter } from "@/components/DecisionLetter";
import { EmptyState, ErrorState } from "@/components/States";
import { useT } from "@/lib/i18n";

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
  const letter = createDecisionLetter(result, new Date(), t);
  return <DecisionLetter letter={letter} />;
}
