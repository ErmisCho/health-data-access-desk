import { useRef } from "react";
import { useHdab } from "@/lib/hdab";
import { Link } from "@tanstack/react-router";
import { Globe, Menu } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { isRole, ROLES, usePreferences } from "@/lib/preferences";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function PreferenceFields() {
  const { lang, setLang } = useLang();
  const { configs, selected, select, error } = useHdab();
  const { role, setRole } = usePreferences();
  const t = useT();
  const inputClass =
    "mt-1 min-h-11 w-full rounded border border-input bg-background px-3 text-foreground";
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        {t("nav.language")}
        <select
          className={inputClass}
          value={lang}
          onChange={(event) => setLang(event.target.value === "de" ? "de" : "en")}
        >
          <option value="de">{t("nav.langToggle.de")}</option>
          <option value="en">{t("nav.langToggle.en")}</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t("nav.accessBody")}
        <select
          className={inputClass}
          value={selected?.code ?? ""}
          disabled={!configs.length}
          onChange={(event) => select(event.target.value)}
        >
          {!configs.length && <option value="">{t("nav.loading")}</option>}
          {configs.map((config) => (
            <option key={config.code} value={config.code}>
              {config.code === "at" || config.code === "de"
                ? t(`nav.country.${config.code}`)
                : config.country}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="status" className="text-sm">
          {t("nav.bodyError")}
        </p>
      )}
      {selected && (
        <p className="text-sm text-muted-foreground">
          {selected.name}
          <br />
          <a className="underline underline-offset-4" href={`mailto:${selected.contact}`}>
            {selected.contact}
          </a>
        </p>
      )}
      <label className="block text-sm font-medium">
        {t("desk.roleLabel")}
        <select
          className={`${inputClass} capitalize`}
          value={role}
          onChange={(event) => {
            if (isRole(event.target.value)) setRole(event.target.value);
          }}
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {t(`desk.role.${value}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function SiteHeader() {
  const t = useT();
  const { role, setRole, needsSetup, completeSetup } = usePreferences();
  const settingsButton = useRef<HTMLButtonElement>(null);
  const links = [
    ["/how-we-decide", "nav.howWeDecide"],
    ["/examples", "nav.examples"],
    ["/register", "nav.register"],
    ["/desk", "nav.openDesk"],
  ] as const;
  return (
    <header className="border-b border-primary bg-background text-primary">
      <div className="border-b border-border bg-muted">
        <div className="mx-auto flex min-h-7 max-w-6xl items-center gap-2 px-5 py-1 text-xs sm:h-7 sm:py-0 sm:px-6">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 24"
            className="h-4 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M2 2h16v10c0 5-4 8-8 10-4-2-8-5-8-10Z" />
          </svg>
          <span>{t("nav.demoService")}</span>
        </div>
      </div>
      <nav
        aria-label={t("nav.mainNav")}
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-5 sm:px-6"
      >
        <Link to="/" className="shrink-0 text-sm font-semibold tracking-tight sm:text-lg">
          {t("nav.home")}
        </Link>
        <div className="ml-auto hidden items-center gap-4 xl:flex">
          {links.map(([to, key]) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
            >
              {t(key)}
            </Link>
          ))}
        </div>
        <div
          className="hidden shrink-0 rounded border border-border p-0.5 md:flex"
          role="group"
          aria-label={t("desk.roleLabel")}
        >
          {ROLES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={role === value}
              onClick={() => setRole(value)}
              className={`min-h-11 rounded px-2 text-sm font-medium capitalize ${role === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {t(`desk.role.${value}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <button
                ref={settingsButton}
                type="button"
                aria-label={t("nav.settings")}
                className="inline-flex size-11 items-center justify-center rounded hover:bg-muted"
              >
                <Globe aria-hidden="true" className="size-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              aria-label={t("nav.settings")}
              className="max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto"
            >
              <PreferenceFields />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("nav.menu")}
                className="inline-flex size-11 items-center justify-center rounded hover:bg-muted xl:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {links.map(([to, key]) => (
                <DropdownMenuItem asChild key={to} className="min-h-11">
                  <Link to={to}>{t(key)}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <Dialog
        open={needsSetup}
        onOpenChange={(open) => {
          if (!open) completeSetup();
        }}
      >
        <DialogContent
          closeLabel={t("setup.close")}
          className="max-h-[calc(100dvh-2rem)] max-w-[min(28rem,calc(100vw-2rem))] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            settingsButton.current?.focus();
          }}
        >
          <DialogTitle>{t("setup.title")}</DialogTitle>
          <DialogDescription>{t("setup.description")}</DialogDescription>
          <PreferenceFields />
          <button
            type="button"
            onClick={completeSetup}
            className="min-h-11 rounded bg-primary px-4 text-primary-foreground"
          >
            {t("setup.continue")}
          </button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
