import { useEffect, useRef, useState } from "react";
import { listRequests } from "@/lib/ehds";
import { useHdab } from "@/lib/hdab";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Globe, Menu, Shield, UserRound } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { isRole, ROLES, usePreferences } from "@/lib/preferences";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    setWaiting(0);
    if (role !== "staff") return;
    let active = true;
    listRequests()
      .then((h) => { if (active) setWaiting(h.requests.filter((r) => r.status === "staff_review").length); })
      .catch(() => {});
    return () => { active = false; };
  }, [role]);
  const links = [
    ["/how-we-decide", "nav.howWeDecide"],
    ["/examples", "nav.examples"],
    ["/register", "nav.register"],
    ["/desk", "nav.openDesk"],
  ] as const;
  return (
    <header className="border-b border-primary bg-background text-primary">
      <nav
        aria-label={t("nav.mainNav")}
        className="mx-auto flex h-14 max-w-6xl flex-nowrap items-center justify-between gap-2 px-3 sm:px-6"
      >
        <Link
          to="/"
          className="min-w-0 truncate text-sm font-semibold tracking-tight sm:shrink-0 sm:text-lg"
        >
          {t("nav.home")}
        </Link>
        <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">
          {links.map(([to, key]) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center whitespace-nowrap text-sm underline underline-offset-4"
            >
              {t(key)}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center lg:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${t("nav.changeRole")}: ${t(`desk.role.${role}`)}${waiting > 0 ? `, ${waiting} ${t("staff.queue.awaiting")}` : ""}`}
                className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded border border-border px-2 text-sm font-medium capitalize hover:bg-muted sm:gap-2"
              >
                <UserRound aria-hidden="true" className="size-4 shrink-0" />
                {t(`desk.role.${role}`)}
                {waiting > 0 && (
                  <span aria-hidden="true" className="rounded-full bg-amber-600 px-1.5 text-xs font-semibold text-white">
                    {waiting}
                  </span>
                )}
                <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                aria-label={t("desk.roleLabel")}
                value={role}
                onValueChange={(value) => {
                  if (isRole(value)) setRole(value);
                }}
              >
                {ROLES.map((value) => (
                  <DropdownMenuRadioItem key={value} value={value} className="min-h-11 capitalize">
                    {t(`desk.role.${value}`)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <p className="mb-4 flex items-start gap-2 text-xs text-muted-foreground">
                <Shield aria-hidden="true" className="size-4 shrink-0" />
                <span>{t("nav.demoService")}</span>
              </p>
              <PreferenceFields />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("nav.menu")}
                className="inline-flex size-11 items-center justify-center rounded hover:bg-muted lg:hidden"
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
