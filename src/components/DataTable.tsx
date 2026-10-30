import { useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { formatValue, isSuppressed } from "@/lib/answers";
import { useT } from "@/lib/i18n";
export { formatValue } from "@/lib/answers";

export function DataTable({ caption, children }: { caption: string; children: ReactNode }) {
  const t = useT();
  return (
    <div
      role="region"
      aria-label={`${caption} ${t("table.scroll")}`}
      tabIndex={0}
      className="relative overflow-x-auto rounded-lg border border-border bg-card"
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
  const suppressed = isSuppressed(value);
  const t = useT();
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
            <TooltipContent className="max-w-60 font-sans">{t("table.suppressed")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        formatValue(value, percentage)
      )}
    </td>
  );
}
