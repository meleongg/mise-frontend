"use client";

import { requestSodieOpen } from "@/lib/sodieEvents";

const KITCHEN_QUICK_PROMPTS = [
  {
    id: "timing",
    label: "How long?",
    draft: "How long should this current step take, and what should I watch for?",
  },
  {
    id: "technique",
    label: "Technique tip",
    draft: "Give me a short technique tip for the step I'm on right now.",
  },
  {
    id: "next",
    label: "What next?",
    draft: "While I finish this step, what can I prep for the next one?",
  },
] as const;

type KitchenSodieQuickActionsProps = {
  stepLabel: string;
};

/**
 * Compact Ask Sodie chips for Kitchen Mode — open the global FAB with a draft.
 */
export default function KitchenSodieQuickActions({
  stepLabel,
}: KitchenSodieQuickActionsProps) {
  return (
    <section
      className="mt-4 rounded-xl border border-[hsl(var(--paprika))]/20 bg-white/85 px-3 py-3 shadow-sm"
      aria-label="Ask Sodie while cooking"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--paprika))]">
        Ask Sodie
      </p>
      <p className="mt-0.5 text-[11px] text-stone-500">{stepLabel}</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {KITCHEN_QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => requestSodieOpen({ draft: prompt.draft })}
            className="rounded-full border border-[hsl(var(--paprika))]/25 bg-[hsl(var(--paprika))]/5 px-2 py-2 text-center text-[11px] font-medium leading-snug text-stone-800 transition-colors hover:bg-[hsl(var(--paprika))]/10"
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
