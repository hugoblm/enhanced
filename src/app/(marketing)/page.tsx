import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enhanced — Pitche ton idée produit",
  description:
    "Transforme une idée en draft PRD structuré et challengé par la data.",
};

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        Enhanced
      </h1>
    </main>
  );
}
