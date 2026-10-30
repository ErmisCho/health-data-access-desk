import { useHdab } from "@/lib/hdab";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang } = useLang();
  const t = useT();
  const { configs, selected, select, error } = useHdab();
  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <nav
        aria-label={t("nav.mainNav")}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-6"
      >
        <Link
          to="/"
          className="font-display text-lg font-semibold underline underline-offset-4 sm:text-xl"
        >
          {t("nav.home")}
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {t("nav.register")}
          </Link>
          <Link
            to="/how-we-decide"
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {t("nav.howWeDecide")}
          </Link>
          <Link
            to="/examples"
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {t("nav.examples")}
          </Link>
          <Link
            to="/desk"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm underline underline-offset-4"
          >
            {t("nav.openDesk")} <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          {/* Language toggle */}
          <div
            className="flex rounded border border-primary-foreground/30 p-0.5"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              aria-pressed={lang === "de"}
              onClick={() => setLang("de")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                lang === "de"
                  ? "bg-primary-foreground text-primary"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              <span aria-hidden="true">{t("nav.langToggle.de")}</span>
              <span className="sr-only">{t("nav.langToggle.switchTo.de")}</span>
            </button>
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                lang === "en"
                  ? "bg-primary-foreground text-primary"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              <span aria-hidden="true">{t("nav.langToggle.en")}</span>
              <span className="sr-only">{t("nav.langToggle.switchTo.en")}</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 pb-4 text-sm sm:px-6">
        <label className="flex items-center gap-2">
          {lang === "de" ? "Zugangsstelle" : "Access body"}
          <select
            aria-label={lang === "de" ? "Zugangsstelle" : "Access body"}
            className="rounded border border-primary-foreground/40 bg-primary px-2 py-1 text-primary-foreground"
            value={selected?.code ?? ""}
            disabled={!configs.length}
            onChange={(event) => select(event.target.value)}
          >
            {!configs.length && (
              <option value="">{lang === "de" ? "Wird geladen…" : "Loading…"}</option>
            )}
            {configs.map((config) => (
              <option key={config.code} value={config.code}>
                {config.country}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <>
            <span>{selected.name}</span>
            <a className="underline" href={`mailto:${selected.contact}`}>
              {selected.contact}
            </a>
          </>
        )}
        {error && (
          <span role="status">
            {lang === "de"
              ? "Zugangsstellen konnten nicht geladen werden."
              : "Access bodies could not be loaded."}
          </span>
        )}
      </div>
    </header>
  );
}
