import { useId, useRef, useState } from "react";
import { submitRequest, type DecisionResult } from "@/lib/ehds";
import { useT } from "@/lib/i18n";

interface Row {
  source: string;
  request?: unknown;
  result?: DecisionResult;
  error?: string;
  seconds?: number;
  running?: boolean;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function field(request: unknown, key: string): string {
  if (!request || typeof request !== "object") return "";
  const value = (request as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function QuickTest() {
  const t = useT();
  const id = useId();
  const locked = useRef(false);
  const [json, setJson] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  async function runAll() {
    if (locked.current) return;
    locked.current = true;
    setRunning(true);
    setRows([]);
    const next: Row[] = [];
    function parse(text: string, source: string) {
      try {
        const value: unknown = JSON.parse(text);
        const requests = Array.isArray(value) ? value : [value];
        if (!requests.length) {
          next.push({ source, error: t("demo.quick.emptyArray") });
        } else {
          requests.forEach((request, index) =>
            next.push({ source: `${source} #${index + 1}`, request }),
          );
        }
      } catch {
        next.push({ source, error: t("demo.quick.invalidJson") });
      }
    }
    try {
      if (json.trim()) parse(json, t("demo.quick.paste"));
      for (const file of files) {
        try {
          parse(await readFile(file), file.name);
        } catch {
          next.push({ source: file.name, error: t("demo.quick.readError") });
        }
      }
      setRows([...next]);
      for (let index = 0; index < next.length; index++) {
        const row = next[index]!;
        if (row.error) continue;
        next[index] = { ...row, running: true };
        setRows([...next]);
        const start = performance.now();
        try {
          const result = await submitRequest(row.request);
          next[index] = { ...row, result, seconds: (performance.now() - start) / 1000 };
        } catch (cause) {
          next[index] = {
            ...row,
            error: cause instanceof Error ? cause.message : t("demo.quick.submitError"),
            seconds: (performance.now() - start) / 1000,
          };
        }
        setRows([...next]);
      }
    } finally {
      locked.current = false;
      setRunning(false);
    }
  }

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="min-w-0 rounded border border-border bg-card p-4 sm:p-6"
    >
      <h2 id={`${id}-heading`} className="font-display text-2xl font-semibold">
        {t("demo.quick.heading")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("demo.quick.intro")}</p>
      <label htmlFor={`${id}-json`} className="mt-4 block text-sm font-medium">
        {t("demo.quick.paste")}
      </label>
      <textarea
        id={`${id}-json`}
        value={json}
        onChange={(event) => setJson(event.target.value)}
        disabled={running}
        rows={5}
        className="mt-2 block w-full min-w-0 rounded border border-input bg-background px-3 py-2 font-mono text-sm"
      />
      <div
        className="mt-4 rounded border border-dashed border-input p-4"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!locked.current)
            setFiles((current) => [...current, ...Array.from(event.dataTransfer.files)]);
        }}
      >
        <label htmlFor={`${id}-files`} className="block text-sm font-medium">
          {t("demo.quick.files")}
        </label>
        <p id={`${id}-drop`} className="mt-1 text-sm text-muted-foreground">
          {t("demo.quick.drop")}
        </p>
        <input
          id={`${id}-files`}
          type="file"
          accept=".json,application/json"
          multiple
          disabled={running}
          aria-describedby={`${id}-drop`}
          className="mt-2 block w-full min-w-0 text-sm"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 && (
          <ul className="mt-2 break-words text-sm">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={runAll}
        disabled={running || (!json.trim() && files.length === 0)}
        className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {t("demo.quick.run")}
      </button>
      <p role="status" aria-live="polite" className="mt-3 text-sm">
        {running ? t("demo.quick.running") : rows.length > 0 ? t("demo.quick.finished") : ""}
      </p>
      {rows.length > 0 && (
        <div className="relative w-full max-w-full min-w-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="py-3 text-left font-medium">{t("demo.quick.caption")}</caption>
            <thead>
              <tr>
                {["id", "question", "decision", "articles", "time", "letter"].map((column) => (
                  <th key={column} scope="col" className="border-b border-border px-3 py-2">
                    {t(`demo.quick.col.${column}` as Parameters<typeof t>[0])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const question = field(row.request, "question");
                const result = row.result;
                const decision =
                  result &&
                  (result.needs_review
                    ? t("demo.quick.review")
                    : result.decision === "APPROVE_STATISTICAL"
                      ? t("demo.quick.statistics")
                      : result.decision === "APPROVE_SPE"
                        ? t("demo.quick.secure")
                        : t("demo.quick.rejected"));
                return (
                  <tr key={index} className="border-b border-border align-top">
                    <th scope="row" className="break-words px-3 py-2 font-medium">
                      {field(row.request, "id") || row.source}
                    </th>
                    <td className="px-3 py-2" title={question}>
                      {question.length > 80 ? `${question.slice(0, 79)}…` : question || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.error
                        ? `${t("demo.quick.error")}: ${row.error}`
                        : decision || t(row.running ? "demo.quick.running" : "demo.quick.pending")}
                    </td>
                    <td className="px-3 py-2">{result?.articles.join(", ") || "—"}</td>
                    <td className="px-3 py-2">
                      {row.seconds === undefined ? "—" : row.seconds.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {result && (
                        <a
                          className="text-primary underline underline-offset-4"
                          href={`/desk/letter/${encodeURIComponent(result.request_id)}`}
                        >
                          {t("demo.quick.openLetter")}
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
