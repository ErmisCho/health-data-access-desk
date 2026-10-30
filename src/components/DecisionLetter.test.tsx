import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DecisionResult } from "@/lib/ehds";
import { createDecisionLetter } from "@/lib/decision-letter";
import { buildDecisionLetterPdf } from "@/lib/decision-letter-pdf";
import * as pdfBuilder from "@/lib/decision-letter-pdf";
import { DecisionLetter } from "./DecisionLetter";
import { DecisionDetails } from "./DecisionDetails";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));

const base: DecisionResult = {
  request_id: "R02",
  decision: "REJECT",
  articles: ["Art. 54"],
  reason: "Prohibited purpose",
  answer: null,
  explanation: {
    rule: "Reject prohibited advertising use.",
    trigger_phrases: ["advertising activities"],
    plan_summary: "Count eligible patients by region.",
    articles: [
      {
        number: "54",
        ref: "Art. 54(e)",
        title: "Prohibited secondary use",
        summary: "Advertising is prohibited.",
        quote: "advertising or marketing activities;",
        applies: "advertising or marketing activities",
      },
    ],
  },
};
const statistics: DecisionResult = {
  ...base,
  request_id: "R08",
  decision: "APPROVE_STATISTICAL",
  answer: {
    Wien: { count: "<10", prevalence_pct: "suppressed" },
    Tirol: { count: 30, prevalence_pct: 8.1 },
  },
};
const spe: DecisionResult = {
  ...base,
  request_id: "R05",
  decision: "APPROVE_SPE",
  answer: { cohort_size: 42, patient_records: "PRIVATE_RECORDS" },
  spe_schema: "PRIVATE_SCHEMA",
};
const date = new Date(2026, 9, 30);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Decision letter", () => {
  it.each([base, statistics, { ...statistics, request_id: "R01" }, spe])(
    "renders the ordered letter sections for $request_id",
    (result) => {
      const letter = createDecisionLetter(result, date);
      render(<DecisionLetter letter={letter} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Decision letter");
      expect(
        screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
      ).toEqual([
        "Verdict",
        "Why",
        "Legal basis",
        "What we counted",
        "Results",
        "Conditions and next steps",
      ]);
      expect(screen.getByText(result.request_id)).toBeInTheDocument();
      expect(screen.getByText("30 October 2026")).toBeInTheDocument();
      expect(screen.getByText(letter.verdict)).toBeInTheDocument();
      expect(screen.getByText("advertising activities").tagName).toBe("Q");
      const legal = screen.getByRole("region", { name: "Legal basis" });
      expect(legal.querySelector("blockquote")?.textContent).toBe(
        base.explanation!.articles[0]!.quote,
      );
      expect(legal.querySelector("strong")?.textContent).toBe(
        base.explanation!.articles[0]!.applies,
      );
      if (result.decision === "APPROVE_STATISTICAL") {
        const table = screen.getByRole("table");
        expect(within(table).getByText("<10")).toBeInTheDocument();
        expect(within(table).getByText("suppressed")).toBeInTheDocument();
        expect(within(table).getByText("8.1 %")).toBeInTheDocument();
      } else expect(screen.queryByRole("table")).not.toBeInTheDocument();
      if (result.decision === "APPROVE_SPE") {
        expect(screen.getByText("Cohort size: 42")).toBeInTheDocument();
        expect(screen.getByText(/Access only inside.*Art. 73/)).toBeInTheDocument();
        expect(screen.queryByText(/PRIVATE_/)).not.toBeInTheDocument();
      }
      if (result.decision === "REJECT")
        expect(screen.getByText(/No data released.*Art. 54/)).toBeInTheDocument();
    },
  );

  it.each([base, statistics, spe])(
    "links every result to its saved letter for $request_id",
    (result) => {
      render(<DecisionDetails result={result} />);
      expect(screen.getByRole("link", { name: "View decision letter" })).toHaveAttribute(
        "href",
        `/desk/letter/${result.request_id}`,
      );
    },
  );

  it.each([{ needs_review: true }, { status: "staff_review" as const }])(
    "marks held decisions as awaiting review",
    (held) => {
      render(<DecisionLetter letter={createDecisionLetter({ ...spe, ...held }, date)} />);
      expect(screen.getByText("Awaiting staff review — decision held")).toBeInTheDocument();
      expect(screen.getByText(/No access or data release is authorised/)).toBeInTheDocument();
    },
  );

  it("downloads the PDF with the request reference in its filename", async () => {
    const pdf = buildDecisionLetterPdf(createDecisionLetter(statistics, date));
    const save = vi.spyOn(pdf, "save").mockReturnThis();
    vi.spyOn(pdfBuilder, "buildDecisionLetterPdf").mockReturnValue(pdf);
    render(<DecisionLetter letter={createDecisionLetter(statistics, date)} />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith("decision-R08.pdf"));
  });
});

describe("Decision letter PDF", () => {
  it.each([base, statistics, spe])(
    "creates a real text PDF containing only letter fields for $request_id",
    (result) => {
      const response = {
        ...result,
        private_field: "PRIVATE_FIELD",
        spe_schema: "PRIVATE_SCHEMA",
        parse_errors: [{ definition: "PRIVATE_DEFINITION", reason: "PRIVATE_REASON" }],
      };
      const letter = createDecisionLetter(response, date);
      const pdf = buildDecisionLetterPdf(letter).output();
      expect(pdf).toMatch(/^%PDF-/);
      expect(pdf).toContain(letter.reference);
      expect(pdf).toContain(letter.verdict);
      expect(pdf).toContain(letter.decision);
      if (result.decision === "APPROVE_STATISTICAL") {
        expect(pdf).toContain("<10");
        expect(pdf).toContain("suppressed");
      }
      expect(pdf).not.toContain("PRIVATE_");
      expect(JSON.stringify(letter)).not.toContain("PRIVATE_");
    },
  );

  it("wraps long legal quotes, preserves emphasis, and paginates long results", () => {
    const letter = createDecisionLetter(
      {
        ...statistics,
        answer: Object.fromEntries(
          Array.from({ length: 150 }, (_, i) => [`Region ${i}`, { count: "<10" }]),
        ),
      },
      date,
    );
    letter.articles[0]!.quote = "Long legal wording. ".repeat(150) + "Applicable text.";
    letter.articles[0]!.applies = "Applicable text.";
    const pdf = buildDecisionLetterPdf(letter);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    expect(pdf.output()).toMatch(/\/F2 [\s\S]*?\(Applicable text\.\) Tj/);
    expect(pdf.output()).toContain("Region 149");
    expect(pdf.output()).toContain("Conditions and next steps");
  });
});

describe("Memo in decision letter (Issue #35)", () => {
  const memoResult: DecisionResult = {
    ...statistics,
    request_id: "R08-memo",
    memo: {
      text: 'Approved under Article 53 which allows "scientific research related to health or care sectors".',
      quotes: [{ text: "scientific research related to health or care sectors", ref: "Art. 53(1)" }],
      model: "ibm/granite-13b-instruct-v2",
    },
  };

  it("renders memo section in DecisionLetter when memo is present", () => {
    const letter = createDecisionLetter(memoResult, date);
    render(<DecisionLetter letter={letter} />);
    expect(screen.getByText("AI-drafted reasoning memo (quotes verified)")).toBeInTheDocument();
    expect(screen.getByText(/Approved under Article 53/)).toBeInTheDocument();
    // Memo section is accessible by its region role
    expect(
      screen.getByRole("region", { name: "AI-drafted reasoning memo (quotes verified)" }),
    ).toBeInTheDocument();
  });

  it("does not render memo section when memo is absent", () => {
    const letter = createDecisionLetter(statistics, date);
    render(<DecisionLetter letter={letter} />);
    expect(
      screen.queryByText("AI-drafted reasoning memo (quotes verified)"),
    ).not.toBeInTheDocument();
  });

  it("memo section never contains PRIVATE_SCHEMA or patient record keys", () => {
    // Only check that SPE private schema and patient record strings don't appear in the memo
    // (the table may show answer data for statistical results, which is intended)
    const privateResult: DecisionResult = {
      ...memoResult,
      // Use an SPE result where answer is cohort_size only — private records never go to table
      decision: "APPROVE_SPE",
      answer: { cohort_size: 42 },
      spe_schema: "PRIVATE_SCHEMA",
    };
    const letter = createDecisionLetter(privateResult, date);
    expect(JSON.stringify(letter)).not.toContain("PRIVATE_SCHEMA");
    render(<DecisionLetter letter={letter} />);
    expect(screen.queryByText(/PRIVATE_/)).not.toBeInTheDocument();
  });

  it("createDecisionLetter passes memo heading and label from t()", () => {
    const letter = createDecisionLetter(memoResult, date);
    expect(letter.memo).toBeDefined();
    expect(letter.memo?.heading).toBe("AI-drafted reasoning memo (quotes verified)");
    expect(letter.memo?.label).toBe("AI-drafted");
    expect(letter.memo?.text).toContain("Approved under Article 53");
    expect(letter.memo?.quotes).toHaveLength(1);
    expect(letter.memo?.quotes[0]?.ref).toBe("Art. 53(1)");
  });

  it("createDecisionLetter omits memo when result.memo is absent", () => {
    const letter = createDecisionLetter(statistics, date);
    expect(letter.memo).toBeUndefined();
  });
});

describe("Plain decision headlines", () => {
  it.each([
    {
      result: base,
      expectedHeadline: "No — this request cannot be approved",
      expectedNext: /choose a permitted purpose under Article 53/,
    },
    {
      result: statistics,
      expectedHeadline: "Yes — approved for anonymised statistics",
      expectedNext: /groups smaller than 10 are hidden/,
    },
    {
      result: spe,
      expectedHeadline: "Yes — approved for work in a secure processing environment",
      expectedNext: /downloads are blocked and logged/,
    },
    {
      result: { ...spe, needs_review: true },
      expectedHeadline: "A person will review this request",
      expectedNext: /decide before the legal deadline/,
    },
  ] as const)(
    "DecisionDetails leads with correct headline for $result.request_id",
    ({ result, expectedHeadline, expectedNext }) => {
      render(<DecisionDetails result={result as DecisionResult} />);
      expect(screen.getByRole("heading", { level: 3, name: expectedHeadline })).toBeInTheDocument();
      expect(screen.getByText(expectedNext)).toBeInTheDocument();
    },
  );

  it.each([
    { result: base, expectedHeadline: "No — this request cannot be approved" },
    { result: statistics, expectedHeadline: "Yes — approved for anonymised statistics" },
    { result: spe, expectedHeadline: "Yes — approved for work in a secure processing environment" },
    {
      result: { ...spe, needs_review: true },
      expectedHeadline: "A person will review this request",
    },
  ] as const)(
    "DecisionLetter verdict section leads with correct headline for $result.request_id",
    ({ result, expectedHeadline }) => {
      const letter = createDecisionLetter(result as DecisionResult, date);
      render(<DecisionLetter letter={letter} />);
      expect(screen.getByText(expectedHeadline)).toBeInTheDocument();
    },
  );

  it("createDecisionLetter exposes headline and nextSteps fields", () => {
    expect(createDecisionLetter(base, date).headline).toBe("No — this request cannot be approved");
    expect(createDecisionLetter(statistics, date).headline).toBe(
      "Yes — approved for anonymised statistics",
    );
    expect(createDecisionLetter(spe, date).headline).toBe(
      "Yes — approved for work in a secure processing environment",
    );
    expect(createDecisionLetter({ ...spe, needs_review: true }, date).headline).toBe(
      "A person will review this request",
    );
    expect(createDecisionLetter(base, date).nextSteps).toMatch(
      /choose a permitted purpose under Article 53/,
    );
    expect(createDecisionLetter({ ...spe, needs_review: true }, date).nextSteps).toMatch(
      /decide before the legal deadline/,
    );
  });
});
