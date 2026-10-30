import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listHdabs, type PublicHdabConfig } from "./ehds";
import { saveHdab, selectedHdab } from "./hdab-selection";
import { useLang } from "./i18n";

interface HdabContextValue {
  configs: PublicHdabConfig[];
  selected?: PublicHdabConfig | undefined;
  select: (code: string) => void;
  error: boolean;
}
const HdabContext = createContext<HdabContextValue>({
  configs: [],
  select: () => {},
  error: false,
});

export function HdabProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<PublicHdabConfig[]>([]);
  const [code, setCode] = useState(selectedHdab);
  const [error, setError] = useState(false);
  const { setDefaultLang } = useLang();
  const selected = configs.find((c) => c.code === code);
  useEffect(() => {
    let cancelled = false;
    listHdabs()
      .then((items) => {
        if (cancelled) return;
        const initial =
          items.find((c) => c.code === selectedHdab()) ??
          items.find((c) => c.code === "at") ??
          items[0]!;
        saveHdab(initial.code);
        setCode(initial.code);
        setConfigs(items);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!selected) return;
    setDefaultLang(selected.display_language);
    const style = document.documentElement.style;
    const properties = {
      "--accent": selected.branding.accent,
      "--ring": selected.branding.accent,
    };
    const previous = Object.keys(properties).map(
      (key) => [key, style.getPropertyValue(key)] as const,
    );
    Object.entries(properties).forEach(([key, value]) => style.setProperty(key, value));
    return () => {
      previous.forEach(([key, value]) =>
        value ? style.setProperty(key, value) : style.removeProperty(key),
      );
    };
  }, [selected, setDefaultLang]);
  function select(next: string) {
    if (!configs.some((config) => config.code === next)) return;
    saveHdab(next);
    setCode(next);
  }
  return (
    <HdabContext.Provider value={{ configs, selected, select, error }}>
      {children}
    </HdabContext.Provider>
  );
}
export function useHdab() {
  return useContext(HdabContext);
}
