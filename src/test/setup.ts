import "@testing-library/jest-dom/vitest";
import type {} from "vitest/jsdom";

// Recent Node versions expose a native localStorage that can be undefined.
// Vitest keeps that global instead of copying jsdom's browser storage; its
// `window` alias points to globalThis too, so use the actual jsdom window.
for (const key of ["localStorage", "sessionStorage"] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: jsdom.window[key],
  });
}

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
