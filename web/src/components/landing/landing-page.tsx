"use client";

import Link from "next/link";
import { ExternalLink, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/dashboard/logo";
import { LanguageToggle, useT } from "@/components/language";
import { SITE } from "@/lib/site";
import { Architecture } from "./architecture";
import { Hero } from "./hero";
import { Features, Problem } from "./sections";

function Header() {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <Logo />
        <nav className="ml-6 hidden gap-5 text-sm text-muted-foreground md:flex">
          <a href="#problem" className="hover:text-foreground">{t("The problem")}</a>
          <a href="#features" className="hover:text-foreground">{t("What it does")}</a>
          <a href="#architecture" className="hover:text-foreground">{t("How it works")}</a>
          <a href="#team" className="hover:text-foreground">{t("Built by")}</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("Sign in")}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Builder() {
  const t = useT();
  return (
    <section id="team" className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">04</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{t("Built by")}</h2>
      </div>
      <article className="flex max-w-md items-center gap-4 rounded-lg border border-border bg-card p-5">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
          <UserRound className="size-6" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-medium text-foreground">{SITE.builderName}</p>
          <p className="text-sm text-muted-foreground">{SITE.builderRole}</p>
        </div>
      </article>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          {SITE.event} · {SITE.problemStatement} · {SITE.organisation}
        </p>
        <p className="text-xs">Prototype with a simulated sensor feed. Not an official NCPOR system.</p>
        <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          GitHub <ExternalLink className="size-3.5" />
        </a>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Problem />
        <Features />
        <Architecture />
        <Builder />
      </main>
      <Footer />
    </>
  );
}
