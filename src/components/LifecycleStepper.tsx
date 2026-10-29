import { cn } from "@/lib/utils";

const steps = ["Submitted", "Assessed", "Staff review", "Decided", "Fulfilled"] as const;
export type LifecycleStep = (typeof steps)[number];

/** Timestamps are optional: never infer a fulfilment or review event from a verdict. */
export function LifecycleStepper({
  current,
  needsReview = false,
  timestamps = {},
}: {
  current: LifecycleStep;
  needsReview?: boolean;
  timestamps?: Partial<Record<LifecycleStep, string>>;
}) {
  const visibleSteps = steps.filter(
    (step) => step !== "Staff review" || needsReview || current === step,
  );
  const currentIndex = visibleSteps.indexOf(current);
  return (
    <ol aria-label="Request lifecycle" className="grid grid-cols-2 gap-3 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
      {visibleSteps.map((step, index) => (
        <li
          key={step}
          aria-current={step === current ? "step" : undefined}
          className={cn(
            "min-w-0 border-t-4 border-border pt-2 text-sm",
            index <= currentIndex && "border-accent",
          )}
        >
          <span className={cn("block", step === current && "font-semibold")}>{step}</span>
          <span className="text-xs text-muted-foreground">
            {index < currentIndex ? "Complete" : step === current ? "Current" : "Pending"}
          </span>
          {timestamps[step] && (
            <time className="mt-1 block break-words font-mono text-xs" dateTime={timestamps[step]}>
              {timestamps[step]}
            </time>
          )}
        </li>
      ))}
    </ol>
  );
}
