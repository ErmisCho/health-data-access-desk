import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  SAMPLE_ENTRIES,
  submitRequest,
  listRequests,
  downloadRequest,
  type Decision,
  type DecisionResult,
  type StoredRequest,
} from "@/lib/ehds";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EHDS Access Desk — Health Data Access Body" },
      { name: "description", content: "Submit EHDS secondary-use data requests and review decisions, cited articles and secure-environment status." },
      { property: "og:title", content: "EHDS Access Desk" },
      { property: "og:description", content: "Health Data Access Body desk for European Health Data Space requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const decisionStyle: Record<Decision, string> = {
  REJECT: "bg-destructive text-destructive-foreground",
  APPROVE_STATISTICAL: "bg-success text-success-foreground",
  APPROVE_SPE: "bg-info text-info-foreground",
};

function DecisionBadge({ d }: { d: Decision }) {
  return <span className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold ${decisionStyle[d]}`}>{d}</span>;
}

function Index() {
  const [role, setRole] = useState<"applicant" | "staff">("applicant");
  return (
    <div className="min-h-screen font-sans">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest opacity-70">Health Data Access Body · EHDS</p>
            <h1 className="font-display text-3xl font-bold">EHDS Access Desk</h1>
          </div>
          <div className="flex rounded border border-primary-foreground/30 p-1" role="tablist">
            {(["applicant", "staff"] as const).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={role === r}
                onClick={() => setRole(r)}
                className={`rounded px-4 py-1.5 text-sm font-medium capitalize ${role === r ? "bg-accent text-accent-foreground" : "opacity-80 hover:opacity-100"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{role === "applicant" ? <Applicant /> : <Staff />}</main>
    </div>
  );
}

function Applicant() {
  const [text, setText] = useState(JSON.stringify(SAMPLE_ENTRIES[0].request, null, 2));
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    setBusy(true);
    setResult(await submitRequest(parsed));
    setBusy(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-2xl font-semibold">Data access request</h2>
        <label className="mt-4 block text-sm text-muted-foreground">
          Sample request
          <select
            className="mt-1 block w-full rounded border border-input bg-card px-3 py-2 text-foreground"
            onChange={(e) => setText(JSON.stringify(SAMPLE_ENTRIES[+e.target.value].request, null, 2))}
          >
            {SAMPLE_ENTRIES.map((s, i) => (
              <option key={s.id} value={i}>{s.label}</option>
            ))}
          </select>
        </label>
        <textarea
          aria-label="Request JSON"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 h-80 w-full rounded border border-input bg-card p-3 font-mono text-sm"
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <button onClick={submit} disabled={busy} className="mt-4 rounded bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Evaluating…" : "Submit request"}
        </button>
      </section>
      <section className="rounded border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-semibold">
          Decision
          {result?.mock && (
            <span className="ml-3 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs font-normal text-muted-foreground align-middle">
              mock data
            </span>
          )}
        </h2>
        {!result ? (
          <p className="mt-4 text-muted-foreground">Submit a request to see the HDAB decision.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <DecisionBadge d={result.decision} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Cited articles</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {result.articles.map((a) => (
                  <span key={a} className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">{a}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Reason</p>
              <p className="mt-1">{result.reason}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Results</p>
              {result.results.length ? (
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {result.results.map((r) => (
                      <tr key={r.label} className="border-b border-border">
                        <td className="py-2 font-mono">{r.label}</td>
                        <td className="py-2 text-right">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No results released.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Staff() {
  const [rows, setRows] = useState<StoredRequest[]>([]);
  const [msg, setMsg] = useState<Record<string, string>>({});
  useEffect(() => {
    listRequests().then(setRows);
  }, []);

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold">Past requests</h2>
      <div className="mt-4 overflow-x-auto rounded border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">ID</th><th className="p-3">Applicant</th><th className="p-3">Decision</th>
              <th className="p-3 text-right">Cohort</th><th className="p-3">Secure env.</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-3 font-mono">{r.request.id}</td>
                <td className="p-3">{r.request.applicant}</td>
                <td className="p-3"><DecisionBadge d={r.result.decision} /></td>
                <td className="p-3 text-right font-mono">{r.result.cohort_size.toLocaleString("en")}</td>
                <td className="p-3 font-mono text-xs">{r.result.spe_status}</td>
                <td className="p-3 text-right">
                  {msg[i] ? (
                    <span className="text-xs font-medium text-destructive">{msg[i]}</span>
                  ) : (
                    <button
                      onClick={async () => {
                        const res = await downloadRequest(r.request.id);
                        setMsg((m) => ({ ...m, [i]: res.message }));
                      }}
                      className="rounded border border-input px-3 py-1 text-xs hover:bg-muted"
                    >
                      Download
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
