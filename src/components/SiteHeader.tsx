import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6"
      >
        <Link
          to="/"
          className="font-display text-lg font-semibold underline underline-offset-4 sm:text-xl"
        >
          EHDS Access Desk
        </Link>
        <Link
          to="/desk"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm underline underline-offset-4"
        >
          Open the desk <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </nav>
    </header>
  );
}
