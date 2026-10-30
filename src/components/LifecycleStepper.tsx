import { cn } from "@/lib/utils";
import type { TimelineEvent, DecisionDeadline } from "@/lib/ehds";
import { useT, useLang } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const steps = ["Submitted", "Assessed", "Staff review", "Decided", "Fulfilled"] as const;
export type LifecycleStep = (typeof steps)[number];

const STATUS_TO_STEP: Record<TimelineEvent["status"], LifecycleStep> = {
  submitted: "Submitted",
  assessed: "Assessed",
  staff_review: "Staff review",
  decided: "Decided",
  fulfilled: "Fulfilled",
};

function formatAt(at: string, locale: string): string {
  if (!at) return "";
  const d = new Date(at);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(locale);
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
function fromTimeline(timeline: TimelineEvent[], locale: string): {
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
      const formatted = formatAt(event.at, locale);
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
  deadline,
}: {
  current?: LifecycleStep;
  needsReview?: boolean;
  timestamps?: Partial<Record<LifecycleStep, string>>;
  timeline?: TimelineEvent[];
  deadline?: DecisionDeadline | null;
}) {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "de" ? "de-AT" : "en-GB";

  // Map internal step names to translated labels
  const stepLabel: Record<LifecycleStep, string> = {
    Submitted: t("lifecycle.Submitted"),
    Assessed: t("lifecycle.Assessed"),
    "Staff review": t("lifecycle.StaffReview"),
    Decided: t("lifecycle.Decided"),
    Fulfilled: t("lifecycle.Fulfilled"),
  };

  // If a timeline is supplied, derive all display values from it.
  const hasTimeline = timeline && timeline.length > 0;
  const resolved = hasTimeline
    ? fromTimeline(timeline, locale)
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

  // Deadline display
  const now = new Date();
  const deadlineDate = deadline?.due ? new Date(deadline.due) : null;
  const isDecided = terminal;

  // Days remaining (for held/in-progress requests)
  let daysLeft: number | null = null;
  if (deadlineDate && !isDecided) {
    daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / 86_400_000);
  }

  // Locale-formatted due date
  const dueDateFormatted = deadlineDate
    ? deadlineDate.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : null;

  // Decided-on date (first "decided" event)
  const decidedAt = timeline?.find((e) => e.status === "decided")?.at ?? null;
  const decidedFormatted = decidedAt
    ? new Date(decidedAt).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : null;

  // Was the decision made on time?
  const onTime =
    isDecided && deadlineDate && decidedAt
      ? new Date(decidedAt) <= deadlineDate
      : null;

  return (
    <div className="space-y-3">
      <ol aria-label={t("lifecycle.aria")} className="grid grid-cols-2 gap-3 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
        {visibleSteps.map((step, index) => (
          <li
            key={step}
            aria-current={step === current ? "step" : undefined}
            className={cn(
              "min-w-0 border-t-4 border-border pt-2 text-sm",
              index <= currentIndex && "border-accent",
            )}
          >
            <span className={cn("block", step === current && !terminal && "font-semibold")}>
              {stepLabel[step]}
            </span>
            <span className="text-xs text-muted-foreground">
              {index < currentIndex
                ? t("lifecycle.status.complete")
                : step === current
                ? terminal && isLastStep
                  ? t("lifecycle.status.complete")
                  : t("lifecycle.status.current")
                : t("lifecycle.status.pending")}
            </span>
            {effectiveTimestamps[step] && (
              <time className="mt-1 block break-words font-mono text-xs" dateTime={effectiveTimestamps[step]}>
                {effectiveTimestamps[step]}
              </time>
            )}
          </li>
        ))}
      </ol>
      {deadline && dueDateFormatted && (
        <div className="rounded border border-border bg-muted/50 px-3 py-2 text-sm" data-testid="deadline-banner">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted">
                  {isDecided
                    ? decidedFormatted && onTime !== null
                      ? onTime
                        ? t("lifecycle.deadline.decidedOnTime").replace("{date}", decidedFormatted)
                        : t("lifecycle.deadline.decidedLate").replace("{date}", decidedFormatted)
                      : t("lifecycle.deadline.due").replace("{date}", dueDateFormatted).replace("{ref}", deadline.basis_ref)
                    : daysLeft !== null && daysLeft >= 0
                    ? t("lifecycle.deadline.daysLeft").replace("{n}", String(daysLeft)).replace("{date}", dueDateFormatted).replace("{ref}", deadline.basis_ref)
                    : t("lifecycle.deadline.overdue").replace("{date}", dueDateFormatted).replace("{ref}", deadline.basis_ref)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p className="mb-1 font-semibold">{deadline.basis_ref}</p>
                <p className="italic">&ldquo;{deadline.basis_quote}&rdquo;</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
