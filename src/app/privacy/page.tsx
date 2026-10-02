import LegalDocument from "@/components/LegalDocument";
import LegalPageShell from "@/components/LegalPageShell";
import { privacySections } from "@/content/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Mise",
  description:
    "How Mise collects, uses, and protects your account, plans, shopping, and Sodie chat data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <LegalDocument
        title="Privacy Policy"
        sections={privacySections}
      />
    </LegalPageShell>
  );
}
