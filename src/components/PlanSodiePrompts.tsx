"use client";

import SodieAvatar from "@/components/SodieAvatar";
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
 * When dismissed, a compact control can restore the tip.
 */
export default function PlanSodiePrompts({
  hasActivePlan,
}: PlanSodiePromptsProps) {
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      setExpanded(window.localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setExpanded(true);
    }
    setReady(true);
  }, []);

  function dismiss() {
    setExpanded(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
  }

  function restore() {
    setExpanded(true);
    try {
      window.localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
  }

  if (!hasActivePlan || !ready) return null;

  if (!expanded) {
    return (
      <div className="mx-auto mb-6 flex w-full max-w-3xl justify-end">
        <button
          type="button"
          onClick={restore}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--paprika))]/25 bg-white/80 px-3 py-1.5 font-body text-xs text-[#262218]/80 shadow-sm transition-colors hover:border-[hsl(var(--paprika))]/45 hover:bg-[hsl(var(--paprika))]/5 hover:text-[#262218]"
        >
          <SodieAvatar size="sm" animate="none" />
          Suggestions
        </button>
      </div>
    );
  }

  return (
    <section
      className="mx-auto mb-6 w-full max-w-3xl rounded-2xl border border-[hsl(var(--paprika))]/20 bg-white/85 px-5 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6"
      aria-label="Ask Sodie suggestions"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <SodieAvatar size="md" animate="none" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-[#262218] sm:text-base">
                Not sure where to start? Ask Sodie about this week
              </p>
              <p className="mt-1 font-body text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Opens the chat button in the corner — your plan stays in
                context.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-[hsl(var(--paprika))]/10 hover:text-[#262218]"
              aria-label="Dismiss Sodie suggestions"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div
            className="mt-4 flex flex-wrap gap-2.5"
            role="group"
            aria-label="Suggested questions for Sodie"
          >
            {PLAN_PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => requestSodieOpen({ draft: suggestion })}
                className="max-w-full rounded-full border border-[hsl(var(--paprika))]/25 bg-[hsl(var(--paprika))]/5 px-3.5 py-2 text-left font-body text-xs text-[#262218] transition-colors hover:bg-[hsl(var(--paprika))]/10 sm:text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
