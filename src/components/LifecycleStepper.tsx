import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/ehds";

const steps = ["Submitted", "Assessed", "Staff review", "Decided", "Fulfilled"] as const;
export type LifecycleStep = (typeof steps)[number];

const STATUS_TO_STEP: Record<TimelineEvent["status"], LifecycleStep> = {
  submitted: "Submitted",
  assessed: "Assessed",
  staff_review: "Staff review",
  decided: "Decided",
  fulfilled: "Fulfilled",
};

function formatAt(at: string): string {
  if (!at) return "";
  const d = new Date(at);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

/**
 * Derive timestamps and current step from a timeline array.
 * The last event in the timeline is the current step.
 */
function fromTimeline(timeline: TimelineEvent[]): {
  current: LifecycleStep;
  needsReview: boolean;
  timestamps: Partial<Record<LifecycleStep, string>>;
} {
  const timestamps: Partial<Record<LifecycleStep, string>> = {};
  let current: LifecycleStep = "Submitted";
  let needsReview = false;

  for (const event of timeline) {
    const step = STATUS_TO_STEP[event.status];
    if (step) {
      const formatted = formatAt(event.at);
      if (formatted) timestamps[step] = formatted;
      current = step;
    }
    if (event.status === "staff_review") needsReview = true;
  }

  return { current, needsReview, timestamps };
}

/** Timestamps are optional: never infer a fulfilment or review event from a verdict. */
export function LifecycleStepper({
  current: currentProp,
  needsReview = false,
  timestamps = {},
  timeline,
}: {
  current?: LifecycleStep;
  needsReview?: boolean;
  timestamps?: Partial<Record<LifecycleStep, string>>;
  timeline?: TimelineEvent[];
}) {
  // If a timeline is supplied, derive all display values from it.
  const resolved = timeline && timeline.length > 0
    ? fromTimeline(timeline)
    : { current: currentProp ?? "Submitted", needsReview, timestamps };

  const current = resolved.current;
  const effectiveNeedsReview = resolved.needsReview;
  const effectiveTimestamps = resolved.timestamps;

  const visibleSteps = steps.filter(
    (step) => step !== "Staff review" || effectiveNeedsReview || current === step,
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
          {effectiveTimestamps[step] && (
            <time className="mt-1 block break-words font-mono text-xs" dateTime={effectiveTimestamps[step]}>
              {effectiveTimestamps[step]}
            </time>
          )}
        </li>
      ))}
    </ol>
  );
}
