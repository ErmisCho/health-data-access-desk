import { useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";

export function DataTable({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={`${caption} table, scroll horizontally if needed`}
      tabIndex={0}
      className="overflow-x-auto rounded-lg border border-border bg-card"
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function DataCell({
  value,
  percentage = false,
}: {
  value: string | number | undefined;
  percentage?: boolean;
}) {
  const suppressed = typeof value === "string" && /^(?:<\s*10|suppressed)$/i.test(value.trim());
  const [open, setOpen] = useState(false);
  return (
    <td className={cn("p-3 text-right font-mono", suppressed && "suppressed-cell")}>
      {suppressed ? (
        <TooltipProvider delayDuration={150}>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="min-h-6 rounded px-1 underline decoration-dotted underline-offset-4"
              >
                {value}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-60 font-sans">
              Value withheld to protect privacy. Small counts (&lt;10) and suppressed statistics are
              not disclosed.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        formatValue(value, percentage)
      )}
    </td>
  );
}

export function formatValue(value: string | number | undefined, percentage = false): string {
  if (value === undefined) return "—";
  const text = String(value).trim();
  if (percentage || /%\s*$/.test(text)) {
    const numeric = text.replace(/\s*%$/, "");
    if (numeric !== "" && Number.isFinite(Number(numeric)))
      return `${Number(numeric).toFixed(1)} %`;
  }
  return String(value);
}
