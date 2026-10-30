import { useEffect, useState } from "react";
import { listRegister, type RegisterEntry, type Decision } from "@/lib/ehds";
import { DecisionBadge } from "./DecisionBadge";
import { SiteHeader } from "./SiteHeader";
import { useT, useLang } from "@/lib/i18n";
import { localizeBackendText } from "@/lib/i18n/translations";

/** Format a date-only YYYY-MM-DD value for display. Parses by parts to avoid UTC shift. */
function fmtRegDate(raw: string, locale: string): string {
  if (!raw) return raw;
  // Match YYYY-MM-DD (date-only) — parse as local date to avoid UTC timezone shift
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) {
    // For en (en-GB default): keep YYYY-MM-DD; for de-AT: show in DE format
    if (!locale.startsWith("de")) return raw;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString(locale);
  }
  // Non-date-only strings: fall back to raw
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(locale);
}

export function TransparencyRegister() {
  const t = useT();
  const { lang } = useLang();
  useEffect(() => { document.title = t("page.title.register"); }, [t]);
  const [entries, setEntries] = useState<RegisterEntry[]>([]);
  const [filter, setFilter] = useState<Decision | "">("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    listRegister().then(
      ({ entries }) => {
        if (active) {
          setEntries(entries);
          setStatus("ready");
        }
      },
      () => {
        if (active) setStatus("error");
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const visible = entries.filter((entry) => !filter || entry.decision === filter);
  return (
    <div className="min-h-screen bg-landing text-foreground">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("register.title")}</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">{t("register.intro")}</p>
        <p className="max-w-3xl text-muted-foreground">{t("register.privacy")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="decision-filter" className="font-medium">
            {t("register.filterLabel")}
          </label>
          <select
            id="decision-filter"
            className="min-h-11 max-w-full rounded border border-input bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Decision | "")}
          >
            <option value="">{t("register.all")}</option>
            <option value="REJECT">{t("register.rejected")}</option>
            <option value="APPROVE_STATISTICAL">{t("register.approvedStats")}</option>
            <option value="APPROVE_SPE">{t("register.approvedSpe")}</option>
          </select>
        </div>
        {status === "loading" && <p role="status">{t("register.loading")}</p>}
        {status === "error" && (
          <div role="alert" className="space-y-3">
            <p>{t("register.loadError")}</p>
            <button
              className="min-h-11 rounded border border-input bg-background px-4 underline focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t("register.tryAgain")}
            </button>
          </div>
        )}
        {status === "ready" && (
          <>
            <p role="status">
              {visible.length}{" "}
              {visible.length === 1
                ? t("register.count.singular")
                : t("register.count.plural")}
            </p>
            {visible.length === 0 ? (
              <p>
                {entries.length === 0
                  ? t("register.empty.noDecisions")
                  : t("register.empty.noMatch")}
              </p>
            ) : (
              <div
                role="region"
                aria-label={t("register.ariaPublished")}
                tabIndex={0}
                className="overflow-x-auto rounded border border-border focus-visible:outline-2 focus-visible:outline-ring"
              >
                <table className="w-full min-w-[760px] text-left text-sm">
                  <caption className="sr-only">{t("register.caption")}</caption>
                  <thead className="bg-muted">
                    <tr>
                      {[
                        t("register.col.reference"),
                        t("register.col.submissionDate"),
                        t("register.col.orgType"),
                        t("register.col.purposeCategory"),
                        t("register.col.decision"),
                        t("register.col.articles"),
                      ].map((heading) => (
                        <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {visible.map((entry) => (
                      <tr key={entry.reference} className="border-t border-border">
                        <th scope="row" className="px-4 py-4 font-mono font-medium">
                          {entry.reference}
                        </th>
                        <td className="whitespace-nowrap px-4 py-4">
                          <time dateTime={entry.date}>{fmtRegDate(entry.date, lang === "de" ? "de-AT" : "en-GB")}</time>
                        </td>
                        <td className="px-4 py-4">{localizeBackendText(entry.organisation_type, lang)}</td>
                        <td className="px-4 py-4">{localizeBackendText(entry.purpose_category, lang)}</td>
                        <td className="px-4 py-4">
                          <DecisionBadge decision={entry.decision} />
                        </td>
                        <td className="px-4 py-4">
                          {entry.articles.map((article) => `Art. ${article}`).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
