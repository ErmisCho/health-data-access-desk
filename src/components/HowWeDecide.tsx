import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "./SiteHeader";
import { useT } from "@/lib/i18n";

export function HowWeDecide() {
  const t = useT();
  useEffect(() => { document.title = t("page.title.howWeDecide"); }, [t]);

  const decisionOrder = [
    { title: t("hwd.order.item1.title"), text: t("hwd.order.item1.text") },
    { title: t("hwd.order.item2.title"), text: t("hwd.order.item2.text") },
    { title: t("hwd.order.item3.title"), text: t("hwd.order.item3.text") },
    { title: t("hwd.order.item4.title"), text: t("hwd.order.item4.text") },
  ];

  return (
    <div className="min-h-screen bg-landing text-foreground">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl space-y-10 px-5 py-10 sm:px-6 sm:py-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t("hwd.eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold">{t("hwd.title")}</h1>
          <p className="mt-5 text-lg text-muted-foreground">{t("hwd.intro")}</p>
        </div>
        <section aria-labelledby="order-title">
          <h2 id="order-title" className="font-display text-2xl font-semibold">
            {t("hwd.order.title")}
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
            {t("hwd.order.note")}
          </p>
        </section>
        <section aria-labelledby="rules-title" className="border-t border-border pt-8">
          <h2 id="rules-title" className="font-display text-2xl font-semibold">
            {t("hwd.rules.title")}
          </h2>
          <p className="mt-4">{t("hwd.rules.text")}</p>
          <p className="mt-3 text-muted-foreground">{t("hwd.rules.quotes")}</p>
        </section>
        <section aria-labelledby="statistics-title" className="border-t border-border pt-8">
          <h2 id="statistics-title" className="font-display text-2xl font-semibold">
            {t("hwd.statistics.title")}
          </h2>
          <p className="mt-4">{t("hwd.statistics.text")}</p>
        </section>
        <section aria-labelledby="opt-outs-title" className="border-t border-border pt-8">
          <h2 id="opt-outs-title" className="font-display text-2xl font-semibold">
            {t("hwd.optouts.title")}
          </h2>
          <p className="mt-4">{t("hwd.optouts.text")}</p>
        </section>
        <section aria-labelledby="secure-title" className="border-t border-border pt-8">
          <h2 id="secure-title" className="font-display text-2xl font-semibold">
            {t("hwd.secure.title")}
          </h2>
          <p className="mt-4">{t("hwd.secure.text")}</p>
        </section>
        <section
          aria-labelledby="testing-title"
          className="rounded-lg bg-primary p-6 text-primary-foreground sm:p-8"
        >
          <h2 id="testing-title" className="font-display text-2xl font-semibold">
            {t("hwd.testing.title")}
          </h2>
          <p className="mt-3">{t("hwd.testing.measured")}</p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">{t("hwd.testing.sample.dt")}</dt>
              <dd className="mt-2">{t("hwd.testing.sample.dd")}</dd>
            </div>
            <div>
              <dt className="font-semibold">{t("hwd.testing.jury.dt")}</dt>
              <dd className="mt-2">{t("hwd.testing.jury.dd")}</dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-primary-foreground/30 pt-5 text-sm">
            {t("hwd.testing.disclaimer")}
          </p>
        </section>
        <section aria-labelledby="ai-title">
          <h2 id="ai-title" className="font-display text-2xl font-semibold">
            {t("hwd.ai.title")}
          </h2>
          <p className="mt-4">{t("hwd.ai.text")}</p>
        </section>
        <Link
          to="/examples"
          className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
        >
          {t("hwd.explore")}
        </Link>
      </main>
    </div>
  );
}
