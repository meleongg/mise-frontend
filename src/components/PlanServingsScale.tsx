"use client";

import { Button } from "@/components/ui/button";
import {
  queryKeys,
  useGenerateShoppingListMutation,
} from "@/hooks/queries";
import { api } from "@/lib/api";
import {
  SCALE_PRESETS,
  formatScaleFactor,
  formatServingsAmount,
  parseServings,
  scaleFactor,
} from "@/lib/servings";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type PlanServingsScaleProps = {
  entryId: string;
  recipeName: string;
  weekNumber: number;
  userId?: string;
  baseline?: string | null;
  selectedServings?: string | null;
  onError?: (message: string) => void;
};

export default function PlanServingsScale({
  entryId,
  recipeName,
  weekNumber,
  userId,
  baseline,
  selectedServings,
  onError,
}: PlanServingsScaleProps) {
  const queryClient = useQueryClient();
  const generateShopping = useGenerateShoppingListMutation();
  const baselineN = parseServings(baseline);
  const canScale = baselineN != null && baselineN > 0;

  const savedSelected = selectedServings ?? "";
  const [draft, setDraft] = useState(savedSelected);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(savedSelected);
  }, [savedSelected, entryId]);

  const effectiveSelected = draft.trim() || (canScale ? formatServingsAmount(baselineN) : "");
  const { factor, needsReview } = useMemo(
    () => scaleFactor(effectiveSelected || null, baseline ?? null),
    [effectiveSelected, baseline]
  );

  const dirty =
    draft.trim() !== savedSelected.trim() &&
    !(draft.trim() === "" && savedSelected.trim() === "");

  async function persist(nextRaw: string) {
    const next = nextRaw.trim();
    const prev = savedSelected.trim();
    if (next === prev) return;
    if (!canScale) return;

    const nextN = parseServings(next || null);
    if (next && nextN == null) {
      onError?.("Enter a plain number (e.g. 4 or 6). Ranges like 2-3 aren’t supported.");
      setDraft(prev);
      return;
    }

    setSaving(true);
    try {
      await api.patchPlanEntryServings(entryId, next || null);
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.weeklyPlans(userId),
        });
      }
      try {
        await generateShopping.mutateAsync(weekNumber);
      } catch {
        onError?.(
          "Scale saved. Open Shopping and refresh the list to apply amounts."
        );
      }
    } catch (err) {
      setDraft(prev);
      onError?.(
        err instanceof Error
          ? err.message
          : `Could not update shopping scale for ${recipeName}`
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canScale) {
    return (
      <div className="mb-3 pointer-events-auto rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
        <p className="font-medium text-amber-950">Shopping scale unavailable</p>
        <p className="mt-0.5 leading-snug text-amber-900/90">
          {baseline
            ? `Recipe yield “${baseline}” isn’t a single number (ranges like 6–8 need a catalog cleanup), so amounts stay at 1×.`
            : "This recipe has no numeric yield, so shopping amounts stay at 1×."}
        </p>
      </div>
    );
  }

  const busy = saving || generateShopping.isPending;
  const activePreset = SCALE_PRESETS.find(
    (p) => Math.abs(p - factor) < 0.001 && !needsReview
  );

  return (
    <div className="mb-3 pointer-events-auto space-y-2 rounded-lg border border-[hsl(var(--paprika))]/20 bg-gradient-to-br from-orange-50/70 to-amber-50/40 px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--paprika))]">
          Shopping scale
        </p>
        <p className="text-[11px] text-stone-500">
          Recipe yields {formatServingsAmount(baselineN)}
          {baseline && /serving/i.test(baseline) ? " servings" : ""}
        </p>
      </div>

      <div
        className="grid grid-cols-4 gap-1.5"
        role="group"
        aria-label={`Scale shopping amounts for ${recipeName}`}
      >
        {SCALE_PRESETS.map((preset) => {
          const amount = formatServingsAmount(baselineN * preset);
          const selected = activePreset === preset && !dirty;
          return (
            <button
              key={preset}
              type="button"
              disabled={busy}
              onClick={() => {
                setDraft(amount);
                void persist(amount);
              }}
              className={cn(
                "rounded-md border px-1.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                selected
                  ? "border-[hsl(var(--paprika))]/50 bg-[hsl(var(--paprika))] text-white"
                  : "border-stone-200 bg-white text-stone-800 hover:border-[hsl(var(--paprika))]/35 hover:bg-orange-50"
              )}
            >
              {formatScaleFactor(preset)}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor={`make-for-${entryId}`}
          className="shrink-0 text-xs text-stone-600"
        >
          Make for
        </label>
        <input
          id={`make-for-${entryId}`}
          type="text"
          inputMode="decimal"
          value={draft}
          placeholder={formatServingsAmount(baselineN)}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (!dirty) return;
            void persist(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-20 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900 disabled:opacity-50"
        />
        {dirty ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            className="h-7 px-2 text-xs"
            onClick={() => void persist(draft)}
          >
            Apply
          </Button>
        ) : null}
      </div>

      <p className="text-[11px] leading-snug text-stone-600">
        {busy
          ? "Updating plan + refreshing shopping list…"
          : needsReview
            ? "Enter a plain number to scale shopping amounts."
            : Math.abs(factor - 1) < 0.001
              ? "Shopping amounts at recipe yield (1×)."
              : `Shopping amounts will use ${formatScaleFactor(factor)} of the recipe.`}
      </p>
    </div>
  );
}
