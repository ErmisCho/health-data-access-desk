import { useState } from "react";
import type { Answer } from "@/lib/ehds";
import { answerColumns, answerRows, metricLabel } from "@/lib/answers";

export function ResultsTable({ answer }: { answer: Answer | null }) {
  const [showPercentages, setShowPercentages] = useState(true);
  const rows = answerRows(answer);
  const columns = answerColumns(rows, showPercentages);
  const depth = Math.max(0, ...rows.map((r) => r.groups.length));
  if (!rows.length)
    return <p className="text-sm text-muted-foreground">No statistical results available.</p>;
  return (
    <div>
      <label className="mb-3 flex items-center gap-3 text-sm">
        Show percentage columns
        <select
          aria-label="Show percentage columns"
          value={showPercentages ? "yes" : "no"}
          onChange={(e) => setShowPercentages(e.target.value === "yes")}
          className="rounded border border-input bg-card px-3 py-1"
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Statistical results</caption>
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: depth }, (_, i) => (
                <th scope="col" className="p-2 text-left" key={i}>
                  {depth === 1 ? "Group" : `Group ${i + 1}`}
                </th>
              ))}
              {columns.map((c) => (
                <th scope="col" className="p-2 text-right" key={metricLabel(c)}>
                  {metricLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={JSON.stringify([r.groups, i])} className="border-b border-border">
                {Array.from({ length: depth }, (_, j) => (
                  <th scope="row" className="p-2 text-left font-normal" key={j}>
                    {r.groups[j] ?? "—"}
                  </th>
                ))}
                {columns.map((c) => (
                  <td className="p-2 text-right font-mono" key={metricLabel(c)}>
                    {r.metrics[c] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
