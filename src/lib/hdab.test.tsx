import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HdabProvider, useHdab } from "./hdab";
import { LangProvider, useLang } from "./i18n";
import { hdabHeaders, saveHdab } from "./hdab-selection";
import { supabase } from "@/integrations/supabase/client";
import { getRequest, listRequests, previewRequest, reviewRequest, submitRequest } from "./ehds";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
const invoke = vi.mocked(supabase.functions.invoke);
const configs = [
  {
    code: "at",
    country: "Austria",
    name: "Austria body",
    contact: "at@example.org",
    display_language: "en",
    languages: ["de", "en"],
    branding: { primary: "#20364d", accent: "#27665f" },
  },
  {
    code: "de",
    country: "Germany",
    name: "Germany body",
    contact: "de@example.org",
    display_language: "de",
    languages: ["de", "en"],
    branding: { primary: "#283e58", accent: "#58418a" },
  },
  {
    code: "fr",
    country: "France",
    name: "France body",
    contact: "fr@example.org",
    display_language: "en",
    languages: ["en"],
    branding: { primary: "#20364d", accent: "#27665f" },
  },
];
function Probe() {
  const { configs, selected, select } = useHdab();
  const { lang, setLang } = useLang();
  return (
    <>
      <span>
        {selected?.name} {selected?.contact} {lang}
      </span>
      {configs.map((c) => (
        <button key={c.code} onClick={() => select(c.code)}>
          {c.country}
        </button>
      ))}
      <button onClick={() => setLang("en")}>English</button>
    </>
  );
}
function mount() {
  return render(
    <LangProvider>
      <HdabProvider>
        <Probe />
      </HdabProvider>
    </LangProvider>,
  );
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  saveHdab("at");
  invoke.mockReset();
  invoke.mockResolvedValue({ data: { configs }, error: null });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  saveHdab("at");
});

it("loads all backend configs and applies language, branding, contact and session selection", async () => {
  mount();
  await screen.findByText("Austria body at@example.org en");
  fireEvent.click(screen.getByText("Germany"));
  expect(screen.getByText("Germany body de@example.org de")).toBeInTheDocument();
  expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#58418a");
  expect(hdabHeaders()).toEqual({ "x-hdab": "de" });
  expect(sessionStorage.getItem("ehds-hdab")).toBe("de");
  cleanup();
  mount();
  await screen.findByText("Germany body de@example.org de");
  fireEvent.click(screen.getByText("English"));
  fireEvent.click(screen.getByText("Austria"));
  fireEvent.click(screen.getByText("Germany"));
  expect(screen.getByText("Germany body de@example.org en")).toBeInTheDocument();
  fireEvent.click(screen.getByText("France"));
  expect(hdabHeaders()).toEqual({ "x-hdab": "fr" });
});

it("preserves an explicit language from a previous mount", async () => {
  sessionStorage.setItem("ehds-lang", "en");
  saveHdab("de");
  mount();
  await screen.findByText("Germany body de@example.org en");
});

it("recovers from a removed config using the default", async () => {
  saveHdab("removed");
  mount();
  await screen.findByText("Austria body at@example.org en");
  expect(hdabHeaders()).toEqual({ "x-hdab": "at" });
});

it("forwards the choice on submit, preview, review, list and retrieval", async () => {
  saveHdab("de");
  invoke.mockResolvedValue({ data: { articles: [], requests: [], unreadable: [] }, error: null });
  await submitRequest({});
  await previewRequest({});
  await reviewRequest({
    action: "approve",
    request_id: "R01",
    reason: "Valid",
    staff_name: "Staff",
  });
  await listRequests();
  await getRequest("R01");
  expect(invoke).toHaveBeenCalledTimes(5);
  for (const [, options] of invoke.mock.calls) expect(options?.headers).toEqual({ "x-hdab": "de" });
});

it("handles failed discovery without an unhandled rejection", async () => {
  invoke.mockRejectedValue(new Error("Offline"));
  mount();
  await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
  expect(screen.queryByText("Germany")).not.toBeInTheDocument();
});
