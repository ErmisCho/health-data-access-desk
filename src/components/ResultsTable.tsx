import { useState } from "react";
import type { Answer } from "@/lib/ehds";
import { answerColumns, answerRows, isPercentage, metricLabel } from "@/lib/answers";

import { DataCell, DataTable } from "./DataTable";
import { EmptyState } from "./States";
import { useLang, useT } from "@/lib/i18n";
import { ResultsChart } from "./ResultsChart";

export function ResultsTable({ answer }: { answer: Answer | null }) {
  const t = useT();
  const { lang } = useLang();
  const [showPercentages, setShowPercentages] = useState(true);
  const rows = answerRows(answer);
  const columns = answerColumns(rows, showPercentages);
  const depth = Math.max(0, ...rows.map((r) => r.groups.length));
  if (!rows.length) return <EmptyState title={t("results.noStats")} />;
  return (
    <div>
      <ResultsChart rows={rows} columns={columns} />
      <label className="mb-3 flex items-center gap-3 text-sm">
        {t("results.showPercentages")}
        <select
          aria-label={t("results.showPercentages")}
          value={showPercentages ? "yes" : "no"}
          onChange={(e) => setShowPercentages(e.target.value === "yes")}
          className="rounded border border-input bg-card px-3 py-1"
        >
          <option value="yes">{t("results.yes")}</option>
          <option value="no">{t("results.no")}</option>
        </select>
      </label>
      <DataTable caption={t("letter.statResults.caption")}>
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: depth }, (_, i) => (
              <th scope="col" className="p-2 text-left" key={i}>
                {depth === 1 ? t("results.group") : `${t("results.groupN")} ${i + 1}`}
              </th>
            ))}
            {columns.map((c) => (
              <th scope="col" className="p-2 text-right" key={c}>
                {metricLabel(c, lang)}
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
                <DataCell
                  key={c}
                  value={r.metrics[c]}
                  percentage={isPercentage(
                    c,
                    rows.map((row) => row.metrics[c]),
                  )}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
