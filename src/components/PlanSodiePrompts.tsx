"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { requestSodieOpen } from "@/lib/sodieEvents";

const PLAN_PROMPT_SUGGESTIONS = [
  "What should I cook first this week?",
  "Any prep I can do ahead for my plan?",
  "How am I doing this week?",
] as const;

type PlanSodiePromptsProps = {
  hasActivePlan: boolean;
};

/**
 * Non-chat Weekly Plan prompts that open the global Ask Sodie FAB.
 * Replaces the old inline SodieCommandBar dual chat panel.
 */
export default function PlanSodiePrompts({
  hasActivePlan,
}: PlanSodiePromptsProps) {
  return (
    <section className="mx-auto mb-6 w-full max-w-3xl rounded-2xl border-2 border-[hsl(var(--paprika))]/30 bg-white/95 p-5 shadow-cozy backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-3">
        <SodieAvatar size="md" animate="none" className="shrink-0" />
        <div className="min-w-0 text-left">
          <p className="font-heading text-lg font-bold leading-tight text-[#262218]">
            Ask Sodie
          </p>
          <p className="mt-0.5 font-body text-sm text-muted-foreground">
            {hasActivePlan
              ? "Opens the floating chat with this week’s plan in context."
              : "Generate your weekly plan first for personalized tips — or open Sodie anytime from the button below."}
          </p>
        </div>
      </div>

      {hasActivePlan ? (
        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Suggested questions for Sodie"
        >
          {PLAN_PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => requestSodieOpen({ draft: suggestion })}
              className="max-w-full rounded-full border border-[hsl(var(--paprika))]/25 bg-[hsl(var(--paprika))]/5 px-3 py-1.5 text-left font-body text-xs text-[#262218] transition-colors hover:bg-[hsl(var(--paprika))]/10 sm:text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => requestSodieOpen()}
          className="mt-4 rounded-full border border-[hsl(var(--paprika))]/25 bg-[hsl(var(--paprika))]/5 px-3 py-1.5 font-body text-sm text-[#262218] transition-colors hover:bg-[hsl(var(--paprika))]/10"
        >
          Open Ask Sodie
        </button>
      )}

      <p className="mt-4 border-t border-[hsl(var(--paprika))]/10 pt-3 font-body text-xs leading-snug text-muted-foreground">
        Sodie uses AI and can make mistakes. Double-check recipes, allergens,
        and instructions before you cook.
      </p>
    </section>
  );
}
