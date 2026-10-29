import type { Decision } from "@/lib/ehds";

const decisionStyle: Record<Decision, string> = {
  REJECT: "bg-destructive text-destructive-foreground",
  APPROVE_STATISTICAL: "bg-success text-success-foreground",
  APPROVE_SPE: "bg-info text-info-foreground",
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <span
      className={`inline-block max-w-full break-words rounded px-2 py-1 font-mono text-xs font-medium ${decisionStyle[decision]}`}
    >
      {decision}
    </span>
  );
}
