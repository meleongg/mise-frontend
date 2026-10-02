import LegalDocument from "@/components/LegalDocument";
import LegalPageShell from "@/components/LegalPageShell";
import { termsSections } from "@/content/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Mise",
  description: "Terms for using Mise, Sodie AI features, and your account.",
};

export default function TermsPage() {
  return (
    <LegalPageShell>
      <LegalDocument title="Terms of Service" sections={termsSections} />
    </LegalPageShell>
  );
}
