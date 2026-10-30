import { createFileRoute } from "@tanstack/react-router";
import { getRequest } from "@/lib/ehds";
import { createDecisionLetter } from "@/lib/decision-letter";
import { DecisionLetter } from "@/components/DecisionLetter";
import { EmptyState, ErrorState } from "@/components/States";

export const Route = createFileRoute("/desk_/letter/$requestId")({
  loader: async ({ params }) => createDecisionLetter(await getRequest(params.requestId)),
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
  component: () => <DecisionLetter letter={Route.useLoaderData()} />,
});
