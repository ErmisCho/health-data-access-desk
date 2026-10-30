import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SAMPLE_ENTRIES, type DecisionExplanation, type LegalArticle } from "@/lib/ehds";
import { ExplanationPanel } from "./ExplanationPanel";
import { LegalQuote } from "./LegalQuote";
import { DecisionDetails } from "./DecisionDetails";

afterEach(cleanup);

// R06-like rendering fixture; this is not a source of regulation text.
const article: LegalArticle = {
  number: "54",
  title: "Prohibited secondary uses",
  ref: "Art. 54(1)(b)",
  point: "(b)",
  summary: "Health data cannot be used for employment decisions.",
  quote: "Prohibited uses include taking decisions in relation to job offers, including hiring.",
  applies: "taking decisions in relation to job offers",
};
const explanation: DecisionExplanation = {
  rule: "Employment decisions are prohibited",
  trigger_phrases: ["renew contracts"],
  trigger_context: ["…before we renew contracts."],
  articles: [article],
};

it("bolds only the applicable substring inside an R06-like quote and preserves every character", () => {
  const { container } = render(<LegalQuote article={article} />);
  const quote = container.querySelector("blockquote")!;
  expect(quote.textContent).toBe(article.quote);
  expect(within(quote).getByText(article.applies!)).toHaveProperty("tagName", "STRONG");
  expect(quote.querySelectorAll("strong")).toHaveLength(1);
  expect(screen.getByText(article.ref).closest("figcaption")).toBeInTheDocument();
  expect(screen.getByText(article.summary)).toBeInTheDocument();
});

it.each([undefined, null, "", "not a verbatim match"])(
  "leaves the quote unchanged when applies is %s",
  (applies) => {
    const { applies: _unused, ...withoutApplies } = article;
    const { container } = render(
      <LegalQuote article={{ ...withoutApplies, ...(applies === undefined ? {} : { applies }) }} />,
    );
    expect(container.querySelector("blockquote")?.textContent).toBe(article.quote);
    expect(container.querySelector("strong")).toBeNull();
  },
);

it("highlights the exact request phrase and keeps the trigger phrase list", () => {
  const purpose = SAMPLE_ENTRIES.find((entry) => entry.id === "R06")!.request.purpose;
  const { container } = render(
    <ExplanationPanel explanation={explanation} purpose={purpose} approved={false} />,
  );
  expect(screen.getByText("Request purpose").nextElementSibling?.textContent).toBe(purpose);
  expect(container.querySelector("mark")?.textContent).toBe("renew contracts");
  expect(
    screen.getByText("Trigger phrases").nextElementSibling?.querySelector("q")?.textContent,
  ).toBe("renew contracts");
});

it("handles repeated, overlapping, empty and literal special-character phrases", () => {
  const purpose = "mean BMI 18+; mean BMI; <script>";
  const { container } = render(
    <ExplanationPanel
      purpose={purpose}
      explanation={{
        ...explanation,
        trigger_phrases: ["mean", "mean BMI", "18+", "", "<script>", "absent"],
      }}
    />,
  );
  expect(screen.getByText("Request purpose").nextElementSibling?.textContent).toBe(purpose);
  expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
    "mean BMI",
    "18+",
    "mean BMI",
    "<script>",
  ]);
  expect(container.querySelector("script")).toBeNull();
});

it("uses saved trigger context when the full request text is unavailable", () => {
  const { container } = render(<ExplanationPanel explanation={explanation} />);
  expect(screen.getByText("Matched request context").nextElementSibling?.textContent).toBe(
    explanation.trigger_context![0],
  );
  expect(container.querySelector("mark")?.textContent).toBe("renew contracts");
});

it.each([false, true])("only shows readable query plans on approvals (staff=%s)", (staff) => {
  const result = {
    request_id: "R08",
    decision: "APPROVE_STATISTICAL" as const,
    articles: ["53"],
    reason: "Allowed",
    answer: null,
    explanation: { ...explanation, plan_summary: "Women with breast cancer, mean BMI per region." },
  };
  const { rerender } = render(<DecisionDetails result={result} staff={staff} />);
  expect(screen.getByText(result.explanation.plan_summary)).toBeInTheDocument();
  rerender(<DecisionDetails result={{ ...result, decision: "REJECT" }} staff={staff} />);
  expect(screen.queryByText("What we understood")).not.toBeInTheDocument();
});

it.each(SAMPLE_ENTRIES)("renders the original purpose and question for $id", ({ request }) => {
  const phrase = request.purpose.split(" ").slice(0, 3).join(" ");
  const { container } = render(
    <DecisionDetails
      request={request}
      result={{
        request_id: request.id,
        decision: "APPROVE_STATISTICAL",
        articles: ["53"],
        reason: "Allowed",
        answer: null,
        explanation: { ...explanation, trigger_phrases: [phrase] },
      }}
    />,
  );
  expect(screen.getByText("Request purpose").nextElementSibling?.textContent).toBe(request.purpose);
  expect(screen.getByText("Request question").nextElementSibling?.textContent).toBe(
    request.question,
  );
  expect(container.querySelector("mark")?.textContent).toBe(phrase);
});
