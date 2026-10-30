const KEY = "ehds-hdab";
export function selectedHdab(): string {
  try {
    return sessionStorage.getItem(KEY) || "at";
  } catch {
    return "at";
  }
}
export function saveHdab(code: string) {
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    /* unavailable */
  }
  current = code;
}
let current: string | undefined;
export function hdabHeaders() {
  return { "x-hdab": current ?? selectedHdab() };
}
