import { Link } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";

const decisionOrder = [
  {
    title: "Reject prohibited purposes first",
    text: "Article 54 takes priority. Insurance premiums and job decisions are prohibited under Art. 54(1)(b); advertising and marketing under Art. 54(1)(c); harmful products such as tobacco and nicotine under Art. 54(1)(d). The outcome is REJECT.",
  },
  {
    title: "A health data request receives anonymised statistics",
    text: "For a permitted purpose, a health data request follows the statistics route under Art. 53 and 69.",
  },
  {
    title: "Justified access applications use a secure environment",
    text: "A data access application must explain why anonymised data is not enough. With that justification, it receives pseudonymised records in a secure processing environment under Art. 53, 66, 68 and 73.",
  },
  {
    title: "Other access applications receive anonymised statistics",
    text: "Without a justification for individual records, an access application is downgraded to anonymised statistics under Art. 53, 66(2) and 69, even if records were requested.",
  },
];

export function HowWeDecide() {
  return (
    <div className="min-h-screen bg-landing text-foreground">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl space-y-10 px-5 py-10 sm:px-6 sm:py-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Methodology · 30 October 2026
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold">How we decide</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            A purpose check comes first, followed by the least detailed data needed to answer the
            request. These rules support Health Data Access Body staff, who remain responsible for
            the final decision.
          </p>
        </div>
        <section aria-labelledby="order-title">
          <h2 id="order-title" className="font-display text-2xl font-semibold">
            Decision order
          </h2>
          <ol className="mt-5 list-decimal space-y-5 pl-6 marker:font-mono marker:text-accent">
            {decisionOrder.map(({ title, text }) => (
              <li key={title} className="pl-2">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-lg border border-border bg-card p-5">
            Negated phrases, such as “we will not use this for marketing”, do not trigger a rule.
            Unclear purposes or unreadable definitions are held for staff review. Staff approve or
            override with a written reason recorded in an audit log. The same safeguards still
            apply.
          </p>
        </section>
        <section aria-labelledby="rules-title" className="border-t border-border pt-8">
          <h2 id="rules-title" className="font-display text-2xl font-semibold">
            Versioned rules and legal text
          </h2>
          <p className="mt-4">
            The rules live in <code className="break-all font-mono">decision_rules.json</code>,
            version 1.0.0, with 14 rules. Every decision records the rule id and rules version.
          </p>
          <p className="mt-3 text-muted-foreground">
            Legal quotes are verbatim from Regulation (EU) 2025/327. All 42 stored paragraphs were
            checked word for word against the official text.
          </p>
        </section>
        <section aria-labelledby="statistics-title" className="border-t border-border pt-8">
          <h2 id="statistics-title" className="font-display text-2xl font-semibold">
            Statistics and the small-cell rule
          </h2>
          <p className="mt-4">
            A fixed program computes statistics from the request’s definitions. Counts below 10 are
            shown as “&lt;10”. Percentages or means based on fewer than 10 people are shown as
            “suppressed”.
          </p>
        </section>
        <section aria-labelledby="opt-outs-title" className="border-t border-border pt-8">
          <h2 id="opt-outs-title" className="font-display text-2xl font-semibold">
            Opt-out handling
          </h2>
          <p className="mt-4">
            Patients who opted out are removed before any counting. The eligible population is
            19,161 of 20,000 synthetic patients. Opt-out counts are never shown.
          </p>
        </section>
        <section aria-labelledby="secure-title" className="border-t border-border pt-8">
          <h2 id="secure-title" className="font-display text-2xl font-semibold">
            Secure processing and blocked downloads
          </h2>
          <p className="mt-4">
            Only the cohort’s pseudonymised records named in the request are copied into the secure
            processing environment. Downloads are blocked with HTTP 403 and logged under Art. 73.
          </p>
        </section>
        <section
          aria-labelledby="testing-title"
          className="rounded-lg bg-primary p-6 text-primary-foreground sm:p-8"
        >
          <h2 id="testing-title" className="font-display text-2xl font-semibold">
            Testing: evaluation and jury simulation
          </h2>
          <p className="mt-3">Measured on 30 October 2026.</p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">10 sample requests</dt>
              <dd className="mt-2">
                10/10 decisions correct; 6/6 numeric answers correct; 0 leaks; the same answer on 3
                runs.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">42 jury test requests</dt>
              <dd className="mt-2">0 wrong decisions; 0 leaks; 13 prohibited purposes rejected.</dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-primary-foreground/30 pt-5 text-sm">
            These are test requests on synthetic data, not real applications. The measurements
            describe these tests and do not guarantee outcomes for future requests.
          </p>
        </section>
        <section aria-labelledby="ai-title">
          <h2 id="ai-title" className="font-display text-2xl font-semibold">
            The role of AI
          </h2>
          <p className="mt-4">
            No AI decides today. An optional AI step may only make outcomes stricter and never sees
            patient data.
          </p>
        </section>
        <Link
          to="/examples"
          className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
        >
          Explore the 10 sample requests
        </Link>
      </main>
    </div>
  );
}
