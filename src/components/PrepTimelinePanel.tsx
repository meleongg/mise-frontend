"use client";

import { PrepTimeline, PrepTimelineItem } from "@/types";
import { Clock3, CookingPot, ShoppingBasket, Sparkles } from "lucide-react";

const KIND_ICON = {
  shop: ShoppingBasket,
  advance_prep: Sparkles,
  cook: CookingPot,
} as const;

function TimelineRow({ item }: { item: PrepTimelineItem }) {
  const Icon =
    item.kind === "shop" || item.kind === "advance_prep" || item.kind === "cook"
      ? KIND_ICON[item.kind]
      : Clock3;
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--paprika))]/30 bg-gradient-to-br from-orange-50 to-amber-100 text-[hsl(var(--paprika))]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="mt-1 w-px flex-1 bg-[hsl(var(--paprika))]/20 last:hidden" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--paprika))]">
            {item.day_label}
          </span>
          {item.duration_minutes != null ? (
            <span className="text-xs text-stone-500">
              ~{item.duration_minutes} min
            </span>
          ) : null}
        </div>
        <p className="font-medium text-stone-900">{item.title}</p>
        <p className="mt-0.5 text-sm text-stone-600">{item.detail}</p>
        {item.reasons?.length ? (
          <ul className="mt-1.5 space-y-0.5">
            {item.reasons.map((reason) => (
              <li key={reason} className="text-xs text-stone-500">
                {reason}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

type PrepTimelinePanelProps = {
  timeline: PrepTimeline;
};

export default function PrepTimelinePanel({ timeline }: PrepTimelinePanelProps) {
  if (!timeline.items?.length) return null;

  return (
    <section
      className="mt-6 rounded-xl border border-[hsl(var(--paprika))]/20 bg-white/80 px-4 py-4 shadow-sm"
      aria-label="Prep timeline"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-stone-900">Prep timeline</h2>
        {timeline.total_active_minutes > 0 ? (
          <p className="text-sm text-stone-600">
            ~{timeline.total_active_minutes} min active cook time this week
          </p>
        ) : null}
      </div>
      {timeline.notes?.length ? (
        <ul className="mb-3 space-y-1 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
          {timeline.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <ol className="mt-1">
        {timeline.items.map((item, index) => (
          <TimelineRow
            key={`${item.kind}-${item.recipe_id ?? item.title}-${index}`}
            item={item}
          />
        ))}
      </ol>
    </section>
  );
}
