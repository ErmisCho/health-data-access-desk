import type { Decision } from "@/lib/ehds";
import { useT } from "@/lib/i18n";

const decisionStyle: Record<Decision, string> = {
  REJECT: "bg-destructive text-destructive-foreground",
  APPROVE_STATISTICAL: "bg-success text-success-foreground",
  APPROVE_SPE: "bg-info text-info-foreground",
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  const t = useT();
  return (
    <span
      className={`inline-block max-w-full break-words rounded px-2 py-1 font-mono text-xs font-medium ${decisionStyle[decision]}`}
    >
      {decision}
      <span className="sr-only">
        {" "}
        ({t(
          decision === "REJECT"
            ? "badge.REJECT"
            : decision === "APPROVE_STATISTICAL"
            ? "badge.APPROVE_STATISTICAL"
            : "badge.APPROVE_SPE",
        )})
      </span>
    </span>
  );
}
