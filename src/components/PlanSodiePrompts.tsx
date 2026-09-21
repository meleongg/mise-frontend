"use client";

import { requestSodieOpen } from "@/lib/sodieEvents";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const PLAN_PROMPT_SUGGESTIONS = [
  "What should I cook first this week?",
  "Any prep I can do ahead for my plan?",
  "How am I doing this week?",
] as const;

const DISMISS_KEY = "mise:plan-sodie-prompts-dismissed";

type PlanSodiePromptsProps = {
  hasActivePlan: boolean;
};

/**
 * Dismissable Weekly Plan tip with chips that open the global Ask Sodie FAB.
 */
export default function PlanSodiePrompts({
  hasActivePlan,
}: PlanSodiePromptsProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
  }

  if (!hasActivePlan || !visible) return null;

  return (
    <section
      className="mx-auto mb-6 w-full max-w-3xl rounded-xl border border-[hsl(var(--paprika))]/20 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
      aria-label="Ask Sodie suggestions"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-medium text-[#262218]">
            Not sure where to start? Ask Sodie about this week
          </p>
          <p className="mt-0.5 font-body text-xs text-muted-foreground">
            Opens the chat button in the corner — your plan stays in context.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[hsl(var(--paprika))]/10 hover:text-[#262218]"
          aria-label="Dismiss Sodie suggestions"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div
        className="mt-3 flex flex-wrap gap-2"
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
    </section>
  );
}
