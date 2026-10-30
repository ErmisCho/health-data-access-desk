import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const ROLES = ["applicant", "staff", "demo"] as const;
export type Role = (typeof ROLES)[number];
export function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}

const PreferencesContext = createContext({
  role: "applicant" as Role,
  setRole: (_role: Role) => {},
  needsSetup: false,
  completeSetup: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("applicant");
  const [needsSetup, setNeedsSetup] = useState(false);
  // Read after hydration so the initial server and browser markup agree.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ehds-role");
      if (isRole(saved)) setRoleState(saved);
      setNeedsSetup(localStorage.getItem("ehds-setup-complete") !== "true");
    } catch {
      setNeedsSetup(true);
    }
  }, []);
  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    try {
      localStorage.setItem("ehds-role", next);
    } catch {
      /* unavailable */
    }
  }, []);
  function completeSetup() {
    setRole(role);
    setNeedsSetup(false);
    try {
      localStorage.setItem("ehds-setup-complete", "true");
    } catch {
      /* unavailable */
    }
  }
  return (
    <PreferencesContext.Provider value={{ role, setRole, needsSetup, completeSetup }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
