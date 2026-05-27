import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Check, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PitchForm } from "@/components/landing/pitch-form";

export const metadata: Metadata = {
  title: "Enhanced — Pitche ton idée produit",
  description:
    "Transforme une idée en draft PRD structuré et challengé par la data.",
};

const PUBLIC_DRAFTS = [
  {
    title: "Recherches sauvegardées pour les power users",
    meta: "Acme · 12 risques scorés · 412 mots",
  },
  {
    title: "Onboarding remanié pour B2C self-serve",
    meta: "Numa · 3 hypothèses identifiées comme spéculatives",
  },
  {
    title: "Notifications push tier_pro",
    meta: "Pilot · score de confiance 38 / 100 — recommandé Test first",
  },
];

export default function LandingPage() {
  return (
    <>
      <Header />

      <main className="flex flex-1 flex-col justify-center px-4 pb-20 pt-10 md:px-8">
        <div className="mx-auto w-full max-w-[740px]">
          <EyebrowPill />

          <h1 className="mb-7 font-heading text-4xl font-semibold leading-[44px] tracking-[-1.2px] text-foreground text-balance whitespace-pre-line md:text-[56px] md:leading-[60px] md:tracking-[-2px]">
            {"Pitche ton idée produit.\nOn la transforme en draft PRD challengé."}
          </h1>

          <PitchForm />

          <WhatSection />
          <PublicDrafts />
        </div>
      </main>

      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 px-4 md:px-8">
      <a href="#" className="inline-flex items-center gap-2 no-underline">
        <Image src="/mark.svg" width={24} height={24} alt="" />
        <span className="font-heading text-base font-semibold tracking-[-0.4px] text-foreground">
          enhanced.pm
        </span>
      </a>
      <div className="flex-1" />
      <a
        href="#"
        className="font-ui text-[13px] font-medium text-[#525252] no-underline hidden lg:inline"
      >
        Drafts publics
      </a>
      <a
        href="#"
        className="font-ui text-[13px] font-medium text-[#525252] no-underline hidden lg:inline"
      >
        Manifeste
      </a>
      <LangToggle />
      <Button variant="outline" size="sm">
        Se connecter
      </Button>
    </header>
  );
}

function LangToggle() {
  return (
    <div className="hidden items-center rounded-lg bg-secondary p-[3px] lg:inline-flex">
      <button className="rounded-md bg-white px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-foreground shadow-xs">
        FR
      </button>
      <button className="rounded-md bg-transparent px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
        EN
      </button>
    </div>
  );
}

function EyebrowPill() {
  return (
    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 pl-1.5 font-ui text-xs text-[#525252] font-medium">
      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10.5px] tracking-[0.5px] text-primary-foreground">
        V1
      </span>
      Pour les équipes qui buildent 10x plus vite — mais pas 10x mieux.
    </div>
  );
}

function WhatSection() {
  return (
    <div className="mt-14 grid grid-cols-1 gap-8 border-t border-border pt-8 md:grid-cols-2">
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 font-ui text-[11px] font-medium uppercase tracking-[1.5px] text-[#525252]">
          <Check size={12} className="text-green-600" strokeWidth={2.5} />
          Ce qu&apos;Enhanced fait
        </div>
        <p className="font-sans text-sm leading-[21px] text-[#525252]">
          Reformule ton idée en problème utilisateur, identifie ce qui est
          prouvé, ce qui ne l&apos;est pas, et ce qu&apos;il faudra démontrer
          avant d&apos;écrire la première ligne de code.
        </p>
      </div>
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 font-ui text-[11px] font-medium uppercase tracking-[1.5px] text-[#525252]">
          <X size={12} className="text-destructive" strokeWidth={2.5} />
          Ce que ce n&apos;est pas
        </div>
        <p className="font-sans text-sm leading-[21px] text-[#525252]">
          Pas un outil de backlog. Pas un générateur de specs. Pas un dashboard.
          Enhanced vit avant tous ces outils.
        </p>
      </div>
    </div>
  );
}

function PublicDrafts() {
  return (
    <div className="mt-10">
      <div className="mb-3 font-ui text-[11px] font-medium uppercase tracking-[1.5px] text-muted-foreground">
        Quelques drafts récents, partagés publiquement
      </div>
      <div className="flex flex-col gap-1.5">
        {PUBLIC_DRAFTS.map((draft, i) => (
          <a
            key={i}
            href="#"
            className="flex items-center gap-3 rounded-[10px] border border-border bg-white px-3.5 py-2.5 no-underline"
          >
            <FileText size={14} className="shrink-0 text-muted-foreground" />
            <span className="font-sans text-sm text-foreground">
              {draft.title}
            </span>
            <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:inline">
              {draft.meta}
            </span>
            <ArrowRight size={12} className="shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-secondary px-4 py-6 text-center font-mono text-[11px] text-muted-foreground md:px-8">
      enhanced.pm · pour les équipes qui veulent builder moins de mauvaises
      features
    </footer>
  );
}
