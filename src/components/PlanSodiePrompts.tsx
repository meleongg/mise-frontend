"use client";

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
 * Lightweight Weekly Plan chips that open the global Ask Sodie FAB.
 * No second chat panel — discoverability only.
 */
export default function PlanSodiePrompts({
  hasActivePlan,
}: PlanSodiePromptsProps) {
  if (!hasActivePlan) return null;

  return (
    <div
      className="mx-auto mb-6 flex w-full max-w-3xl flex-wrap gap-2"
      role="group"
      aria-label="Suggested questions for Sodie"
    >
      {PLAN_PROMPT_SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => requestSodieOpen({ draft: suggestion })}
          className="max-w-full rounded-full border border-[hsl(var(--paprika))]/25 bg-white/90 px-3 py-1.5 text-left font-body text-xs text-[#262218] shadow-sm transition-colors hover:border-[hsl(var(--paprika))]/45 hover:bg-[hsl(var(--paprika))]/5 sm:text-sm"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
