import type { Decision } from "@/lib/ehds";
import { useT } from "@/lib/i18n";

const decisionStyle: Record<Decision, string> = {
  REJECT: "bg-destructive text-destructive-foreground",
  APPROVE_STATISTICAL: "bg-success text-success-foreground",
  APPROVE_SPE: "bg-info text-info-foreground",
};

const badgeKey = (d: Decision) =>
  d === "REJECT"
    ? "badge.REJECT"
    : d === "APPROVE_STATISTICAL"
      ? "badge.APPROVE_STATISTICAL"
      : ("badge.APPROVE_SPE" as const);

export function DecisionBadge({ decision }: { decision: Decision }) {
  const t = useT();
  const label = t(badgeKey(decision));
  return (
    <span
      aria-label={label}
      className={`inline-flex max-w-full items-baseline gap-1.5 break-words rounded px-2 py-1 font-mono text-xs font-medium ${decisionStyle[decision]}`}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="opacity-60">
        ({decision})
      </span>
    </span>
  );
}
