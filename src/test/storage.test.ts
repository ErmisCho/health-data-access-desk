import { afterEach, expect, it } from "vitest";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

it("uses jsdom storage for browser preferences independently of Node's native storage", () => {
  expect(localStorage).toBe(jsdom.window.localStorage);
  expect(sessionStorage).toBe(jsdom.window.sessionStorage);
  localStorage.setItem("preference", "local");
  sessionStorage.setItem("preference", "session");
  expect(localStorage.getItem("preference")).toBe("local");
  expect(sessionStorage.getItem("preference")).toBe("session");
  expect(localStorage).toBeInstanceOf(Storage);
});
