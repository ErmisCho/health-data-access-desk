import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Check, ClipboardPenLine, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useT } from "@/lib/i18n";

export function LandingPage() {
  const t = useT();
  useEffect(() => { document.title = t("page.title.home"); }, [t]);

  const steps = [
    {
      icon: ClipboardPenLine,
      title: t("landing.step1.title"),
      text: t("landing.step1.text"),
    },
    {
      icon: Scale,
      title: t("landing.step2.title"),
      text: t("landing.step2.text"),
    },
    {
      icon: FileCheck2,
      title: t("landing.step3.title"),
      text: t("landing.step3.text"),
    },
  ];

  const questions = [
    {
      id: "privacy",
      title: t("landing.faq.privacy.title"),
      text: t("landing.faq.privacy.text"),
    },
    {
      id: "legal",
      title: t("landing.faq.legal.title"),
      text: t("landing.faq.legal.text"),
    },
    {
      id: "decisions",
      title: t("landing.faq.decisions.title"),
      text: t("landing.faq.decisions.text"),
    },
  ];

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
              {t("landing.eyebrow")}
            </p>
            <h1
              id="hero-title"
              className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              {t("landing.hero")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {t("landing.heroSub")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button
                asChild
                size="lg"
                className="min-h-12 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/desk">
                  {t("landing.cta.submit")} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link
                to="/examples"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                {t("landing.cta.examples")}
              </Link>
              <Link
                to="/how-we-decide"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                {t("landing.cta.howWeDecide")}
              </Link>
            </div>
            <ul aria-label="Safeguards" className="mt-8 flex flex-wrap gap-2">
              {[
                t("landing.chip.legalBasis"),
                t("landing.chip.noPatientData"),
                t("landing.chip.sameAnswer"),
              ].map((chip) => (
                <li
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
                >
                  <Check aria-hidden="true" className="size-3.5 text-accent" />
                  {chip}
                </li>
              ))}
            </ul>
          </div>
          <aside
            aria-labelledby="outputs-title"
            className="rounded-lg border border-border border-t-4 border-t-accent bg-card p-6 sm:p-8"
          >
            <ShieldCheck aria-hidden="true" className="mb-5 size-8 text-accent" />
            <h2 id="outputs-title" className="font-display text-2xl font-semibold">
              {t("landing.whatYouGet.title")}
            </h2>
            <ul className="mt-5 space-y-5">
              {[
                [t("landing.whatYouGet.item1.title"), t("landing.whatYouGet.item1.text")],
                [t("landing.whatYouGet.item2.title"), t("landing.whatYouGet.item2.text")],
                [t("landing.whatYouGet.item3.title"), t("landing.whatYouGet.item3.text")],
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
            {t("landing.howItWorks.title")}
          </h2>
          <ol aria-label={t("landing.steps.list")} className="mt-8 grid gap-8 md:grid-cols-3">
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
          <p className="font-mono text-xs uppercase tracking-widest">{t("landing.proof.eyebrow")}</p>
          <h2 id="proof-title" className="mt-3 font-display text-3xl font-semibold">
            {t("landing.proof.title")}
          </h2>
          <dl className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              [t("landing.proof.stat1.value"), t("landing.proof.stat1.label")],
              [t("landing.proof.stat2.value"), t("landing.proof.stat2.label")],
              [t("landing.proof.stat3.value"), t("landing.proof.stat3.label")],
              [t("landing.proof.stat4.value"), t("landing.proof.stat4.label")],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-sm">{label}</dt>
                <dd className="mt-2 font-mono text-4xl font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 border-t border-primary-foreground/30 pt-5 text-sm leading-relaxed">
            {t("landing.proof.disclaimer")}
          </p>
        </section>

        <section
          id="ai-disclosure"
          aria-labelledby="ai-title"
          className="grid gap-6 border-b border-border py-12 sm:py-16 md:grid-cols-[1fr_2fr] md:gap-12"
        >
          <h2 id="ai-title" className="font-display text-3xl font-semibold whitespace-pre-line">
            {t("landing.aiDisclosure.title")}
          </h2>
          <div className="space-y-5">
            <p>{t("landing.aiDisclosure.p1")}</p>
            <p className="border-l-4 border-accent pl-5 font-medium">
              {t("landing.aiDisclosure.callout")}
            </p>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-title"
          className="grid gap-6 py-12 sm:py-16 md:grid-cols-[1fr_2fr] md:gap-12"
        >
          <h2 id="faq-title" className="font-display text-3xl font-semibold">
            {t("landing.faq.title")}
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
          <p className="text-muted-foreground">{t("landing.footer.credit")}</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
            <Link to="/desk" className="underline underline-offset-4">
              {t("landing.footer.openDesk")}
            </Link>
            <a href="#faq" className="underline underline-offset-4">
              {t("landing.footer.privacy")}
            </a>
            <a href="#ai-disclosure" className="underline underline-offset-4">
              {t("landing.footer.aiDisclosure")}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
