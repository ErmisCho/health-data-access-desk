import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ClipboardPenLine, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const steps = [
  {
    icon: ClipboardPenLine,
    title: "Describe your request",
    text: "Set out the purpose, the data you need and the result you want. Unclear requests are held for staff review.",
  },
  {
    icon: Scale,
    title: "Check the purpose",
    text: "Rules check the purpose against EHDS Chapter IV, including permitted uses and the prohibited purposes in Article 54.",
  },
  {
    icon: FileCheck2,
    title: "Receive a reasoned outcome",
    text: "Get a decision letter and, where approved, anonymised statistics or a route to a secure processing environment.",
  },
];

const questions = [
  {
    id: "privacy",
    title: "What happens to data and privacy?",
    text: "Patient records stay within the protected processing environment. Patient data never goes to AI. Opted-out patients are excluded. Statistics use small-cell suppression: counts below 10 are shown as “<10”. Approved access to pseudonymised records takes place in a secure processing environment, without exporting patient records.",
  },
  {
    id: "legal",
    title: "What is the legal basis?",
    text: "The desk checks secondary-use requests under Regulation (EU) 2025/327, Chapter IV. Article 54 covers prohibited purposes. Articles 53 and 69 support the statistics route; Articles 53, 66, 68 and 73 govern the secure processing route. Each outcome cites the relevant articles so staff can review the reasoning.",
  },
  {
    id: "decisions",
    title: "How are decisions made?",
    text: "Deterministic rules assess the request. Prohibited purposes are rejected; eligible requests can receive anonymised statistics or be directed to a secure processing environment. A fixed program computes the statistics. Unclear cases are held for staff review. The same request under the same rules and data produces the same answer. The HDAB makes the final decision.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-landing font-sans text-foreground">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 sm:px-6">
        <section
          aria-labelledby="hero-title"
          className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-16"
        >
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
              EHDS Chapter IV · Secondary use
            </p>
            <h1
              id="hero-title"
              className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              Can this health-data request be approved?
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Turn a request into a clear, consistent outcome with cited legal reasons and privacy
              safeguards.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button
                asChild
                size="lg"
                className="min-h-12 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/desk">
                  Submit a request <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link
                to="/examples"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                See examples
              </Link>
              <Link
                to="/how-we-decide"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                How we decide
              </Link>
            </div>
            <ul aria-label="Safeguards" className="mt-8 flex flex-wrap gap-2">
              {["Legal basis cited", "No patient data leaves", "Same answer every time"].map(
                (chip) => (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
                  >
                    <Check aria-hidden="true" className="size-3.5 text-accent" />
                    {chip}
                  </li>
                ),
              )}
            </ul>
          </div>
          <aside
            aria-labelledby="outputs-title"
            className="rounded-lg border border-border border-t-4 border-t-accent bg-card p-6 sm:p-8"
          >
            <ShieldCheck aria-hidden="true" className="mb-5 size-8 text-accent" />
            <h2 id="outputs-title" className="font-display text-2xl font-semibold">
              What you get
            </h2>
            <ul className="mt-5 space-y-5">
              {[
                [
                  "A decision you can inspect",
                  "A reasoned letter with the legal articles behind the outcome.",
                ],
                [
                  "A protected route to data",
                  "Anonymised statistics or secure access to pseudonymised records, where approved.",
                ],
                [
                  "A clear handover to staff",
                  "Unclear requests held for review before a final decision.",
                ],
              ].map(([title, text]) => (
                <li key={title}>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section aria-labelledby="steps-title" className="border-t border-border py-12 sm:py-16">
          <h2 id="steps-title" className="font-display text-3xl font-semibold">
            How it works
          </h2>
          <ol aria-label="How it works" className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title}>
                <div className="mb-4 flex items-center gap-3 text-accent">
                  <span className="font-mono text-sm">0{index + 1}</span>
                  <Icon aria-hidden="true" className="size-6" />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="proof-title"
          className="rounded-lg bg-primary px-6 py-10 text-primary-foreground sm:px-10"
        >
          <p className="font-mono text-xs uppercase tracking-widest">Measured, with limits</p>
          <h2 id="proof-title" className="mt-3 font-display text-3xl font-semibold">
            Tested before the next request
          </h2>
          <dl className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              ["10/10", "sample decisions correct"],
              ["6/6", "statistics checks correct"],
              ["0", "leaks in sample tests"],
              ["42", "jury test requests: 0 wrong decisions, 0 leaks"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-sm">{label}</dt>
                <dd className="mt-2 font-mono text-4xl font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 border-t border-primary-foreground/30 pt-5 text-sm leading-relaxed">
            Measured on 30 October 2026 against the live backend, with consistent results over three
            runs. These are test requests, not evidence of performance on all real-world requests or
            a guarantee of future results.
          </p>
        </section>

        <section
          id="ai-disclosure"
          aria-labelledby="ai-title"
          className="grid gap-6 border-b border-border py-12 sm:py-16 md:grid-cols-[1fr_2fr] md:gap-12"
        >
          <h2 id="ai-title" className="font-display text-3xl font-semibold">
            Rules decide.
            <br />
            People remain responsible.
          </h2>
          <div className="space-y-5">
            <p>
              Deterministic rules decide the outcome, and a fixed program calculates the statistics.
              No AI is used today. If enabled later, AI can only make outcomes stricter. Patient
              data never goes to AI.
            </p>
            <p className="border-l-4 border-accent pl-5 font-medium">
              This is decision support for Health Data Access Body staff. Final decisions rest with
              the HDAB.
            </p>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-title"
          className="grid gap-6 py-12 sm:py-16 md:grid-cols-[1fr_2fr] md:gap-12"
        >
          <h2 id="faq-title" className="font-display text-3xl font-semibold">
            Before you begin
          </h2>
          <Accordion type="single" collapsible>
            {questions.map(({ id, title, text }) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger className="min-h-14 gap-4 text-base">{title}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">
                  {text}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-6 text-sm sm:px-6">
          <p className="text-muted-foreground">EHDS Access Desk · Health Data Access Body</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
            <Link to="/desk" className="underline underline-offset-4">
              Open the desk
            </Link>
            <a href="#faq" className="underline underline-offset-4">
              Privacy and legal basis
            </a>
            <a href="#ai-disclosure" className="underline underline-offset-4">
              AI disclosure
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
