/**
 * Tiny i18n module for EHDS Access Desk — Issue #55
 *
 * Provides:
 *   - LangProvider  – wraps the app; reads/writes sessionStorage; updates <html lang>
 *   - useLang()     – returns { lang, setLang }
 *   - useT()        – returns the t() translator for the current language
 *
 * The two dictionaries (en / de) share the same key type so TypeScript will
 * fail at compile time if a key is present in one but not the other.
 */

import {
  createContext,
  useCallback,
  useRef,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { en } from "./i18n/en";
import { de } from "./i18n/de";

export type Lang = "en" | "de";
/** All keys that must be present; values can be any string. */
export type Dict = { [K in keyof typeof en]: string };
export type TranslationKey = keyof Dict;

const DICTIONARIES: Record<Lang, Dict> = { en, de };

const SESSION_KEY = "ehds-lang";

function readSession(): Lang {
  try {
    const v = sessionStorage.getItem(SESSION_KEY);
    return v === "de" ? "de" : "en";
  } catch {
    return "en";
  }
}

function writeSession(lang: Lang) {
  try {
    sessionStorage.setItem(SESSION_KEY, lang);
  } catch {
    /* ignore */
  }
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  setDefaultLang: (l: Lang) => void;
}

const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  setDefaultLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readSession);

  const explicit = useRef(false);
  const setDefaultLang = useCallback((l: Lang) => {
    let saved = null;
    try {
      saved = sessionStorage.getItem(SESSION_KEY);
    } catch {
      /* unavailable */
    }
    if (!explicit.current && saved !== "de" && saved !== "en") setLangState(l);
  }, []);

  function setLang(l: Lang) {
    explicit.current = true;
    setLangState(l);
    writeSession(l);
  }

  // Keep <html lang> in sync whenever the component mounts or lang changes.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, setDefaultLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/** Returns a t() function bound to the current language. */
export function useT() {
  const { lang } = useLang();
  return function t(key: TranslationKey): string {
    return DICTIONARIES[lang][key];
  };
}
