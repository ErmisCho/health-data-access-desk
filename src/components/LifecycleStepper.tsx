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
 * Derive display values from a timeline array.
 * - current: the last step in the timeline
 * - needsReview: true when any staff_review event is present
 * - timestamps: formatted local times for each step
 * - terminal: true when the last event is a completed final step
 *   (fulfilled, or decided when fulfilled is not expected — i.e. no fulfilled event anywhere)
 * - hideFulfilled: true when the terminal decided step has no fulfilled event in the timeline
 *   (REJECT path: show only Submitted→Assessed→Decided)
 */
function fromTimeline(timeline: TimelineEvent[]): {
  current: LifecycleStep;
  needsReview: boolean;
  timestamps: Partial<Record<LifecycleStep, string>>;
  terminal: boolean;
  hideFulfilled: boolean;
} {
  const timestamps: Partial<Record<LifecycleStep, string>> = {};
  let current: LifecycleStep = "Submitted";
  let needsReview = false;
  let hasFulfilled = false;

  for (const event of timeline) {
    const step = STATUS_TO_STEP[event.status];
    if (step) {
      const formatted = formatAt(event.at);
      if (formatted) timestamps[step] = formatted;
      current = step;
    }
    if (event.status === "staff_review") needsReview = true;
    if (event.status === "fulfilled") hasFulfilled = true;
  }

  const lastStatus = timeline[timeline.length - 1]?.status;
  // Terminal: the request has reached its final state.
  const terminal = lastStatus === "fulfilled" ||
    (lastStatus === "decided" && !hasFulfilled);
  // Hide the Fulfilled step when the path ends at decided and fulfilled never occurred.
  const hideFulfilled = lastStatus === "decided" && !hasFulfilled;

  return { current, needsReview, timestamps, terminal, hideFulfilled };
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
  const hasTimeline = timeline && timeline.length > 0;
  const resolved = hasTimeline
    ? fromTimeline(timeline)
    : {
        current: currentProp ?? "Submitted",
        needsReview,
        timestamps,
        terminal: false,
        hideFulfilled: false,
      };

  const current = resolved.current;
  const effectiveNeedsReview = resolved.needsReview;
  const effectiveTimestamps = resolved.timestamps;
  const terminal = resolved.terminal;
  const hideFulfilled = resolved.hideFulfilled;

  const visibleSteps = steps.filter((step) => {
    if (step === "Staff review") return effectiveNeedsReview || current === step;
    if (step === "Fulfilled") return !hideFulfilled;
    return true;
  });
  const currentIndex = visibleSteps.indexOf(current);
  const isLastStep = currentIndex === visibleSteps.length - 1;

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
          <span className={cn("block", step === current && !terminal && "font-semibold")}>{step}</span>
          <span className="text-xs text-muted-foreground">
            {index < currentIndex
              ? "Complete"
              : step === current
              ? terminal && isLastStep ? "Complete" : "Current"
              : "Pending"}
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
