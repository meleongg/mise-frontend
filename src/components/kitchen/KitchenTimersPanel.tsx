"use client";

import { Button } from "@/components/ui/button";
import {
  formatCountdown,
  KITCHEN_TIMER_PRESETS,
  KitchenTimerSuggestion,
  parseStepDurationSuggestions,
} from "@/lib/kitchenTimers";
import { Timer, X } from "lucide-react";

type LiveTimer = {
  id: string;
  label: string;
  remainingSeconds: number;
  done: boolean;
};

type KitchenTimersPanelProps = {
  stepText: string;
  timers: LiveTimer[];
  onStart: (totalSeconds: number, label?: string) => void;
  onDismiss: (id: string) => void;
};

export default function KitchenTimersPanel({
  stepText,
  timers,
  onStart,
  onDismiss,
}: KitchenTimersPanelProps) {
  const suggestions = parseStepDurationSuggestions(stepText);
  const chips: KitchenTimerSuggestion[] = [];
  const seen = new Set<number>();
  for (const item of [...suggestions, ...KITCHEN_TIMER_PRESETS]) {
    if (seen.has(item.totalSeconds)) continue;
    seen.add(item.totalSeconds);
    chips.push(item);
    if (chips.length >= 5) break;
  }

  return (
    <section
      className="mt-4 rounded-xl border border-[hsl(var(--sage))]/25 bg-white/85 px-3 py-3 shadow-sm"
      aria-label="Kitchen timers"
    >
      <div className="flex items-center gap-2">
        <Timer
          className="h-4 w-4 text-[hsl(var(--sage))]"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--sage))]">
          Timers
        </p>
      </div>
      <p className="mt-0.5 text-[11px] text-stone-500">
        Local countdowns for this cook — Sodie can see running ones.
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.totalSeconds}
            type="button"
            onClick={() => onStart(chip.totalSeconds, chip.label)}
            className="rounded-full border border-[hsl(var(--sage))]/30 bg-[hsl(var(--sage))]/5 px-2.5 py-1.5 text-[11px] font-medium text-stone-800 transition-colors hover:bg-[hsl(var(--sage))]/10"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {timers.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {timers.map((timer) => (
            <li
              key={timer.id}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm ${
                timer.done
                  ? "bg-[hsl(var(--paprika))]/10 text-[hsl(var(--paprika))]"
                  : "bg-stone-50 text-stone-800"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{timer.label}</p>
                <p className="font-mono text-xs tabular-nums text-stone-600">
                  {timer.done
                    ? "Done"
                    : formatCountdown(timer.remainingSeconds)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-stone-500"
                onClick={() => onDismiss(timer.id)}
                aria-label={`Dismiss ${timer.label} timer`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
