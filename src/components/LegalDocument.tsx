import type { LegalSection } from "@/content/legal";
import { LEGAL_LAST_UPDATED } from "@/content/legal";

type LegalDocumentProps = {
  title: string;
  intro?: string;
  sections: LegalSection[];
};

export default function LegalDocument({
  title,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 space-y-3 text-center md:text-left">
        <h1 className="font-heading font-black text-3xl md:text-4xl text-[#262218]">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
        {intro ? (
          <p className="font-body text-muted-foreground leading-relaxed">
            {intro}
          </p>
        ) : null}
      </header>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="font-heading font-bold text-xl text-[hsl(var(--paprika))] mb-3">
              {section.title}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.id}-p-${index}`}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul className="list-disc pl-5 space-y-2">
                  {section.bullets.map((item, index) => (
                    <li key={`${section.id}-b-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
