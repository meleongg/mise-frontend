"use client";

import { PrepTimeline, PrepTimelineItem } from "@/types";
import { Clock3, CookingPot, ShoppingBasket, Sparkles } from "lucide-react";
import { useMemo } from "react";

const KIND_ICON = {
  shop: ShoppingBasket,
  advance_prep: Sparkles,
  cook: CookingPot,
} as const;

function TimelineCard({ item }: { item: PrepTimelineItem }) {
  const Icon =
    item.kind === "shop" || item.kind === "advance_prep" || item.kind === "cook"
      ? KIND_ICON[item.kind]
      : Clock3;
  return (
    <article className="rounded-lg border border-[hsl(var(--paprika))]/15 bg-white/90 p-3 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[hsl(var(--paprika))]/30 bg-gradient-to-br from-orange-50 to-amber-100 text-[hsl(var(--paprika))]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {item.duration_minutes != null ? (
          <span className="text-xs text-stone-500">~{item.duration_minutes} min</span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-stone-900">{item.title}</p>
      <p className="mt-0.5 text-xs leading-snug text-stone-600">{item.detail}</p>
      {item.reasons?.length ? (
        <ul className="mt-1.5 space-y-0.5">
          {item.reasons.slice(0, 2).map((reason) => (
            <li key={reason} className="text-[11px] text-stone-500">
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

type PrepTimelinePanelProps = {
  timeline: PrepTimeline;
};

export default function PrepTimelinePanel({ timeline }: PrepTimelinePanelProps) {
  const dayGroups = useMemo(() => {
    const groups: { dayLabel: string; items: PrepTimelineItem[] }[] = [];
    const indexByLabel = new Map<string, number>();
    for (const item of timeline.items || []) {
      const label = item.day_label || "Plan";
      const existing = indexByLabel.get(label);
      if (existing == null) {
        indexByLabel.set(label, groups.length);
        groups.push({ dayLabel: label, items: [item] });
      } else {
        groups[existing].items.push(item);
      }
    }
    return groups;
  }, [timeline.items]);

  if (!timeline.items?.length) return null;

  const isSnapshot = timeline.source === "snapshot";

  return (
    <section
      className="mt-6 rounded-xl border border-[hsl(var(--paprika))]/20 bg-white/80 px-4 py-4 shadow-sm"
      aria-label="Prep timeline"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Prep timeline</h2>
          <p className="text-xs text-stone-500">
            {isSnapshot
              ? "Saved with your plan"
              : "Built from this week’s recipes"}
            {timeline.snapshotted_at
              ? ` · ${new Date(timeline.snapshotted_at).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        {timeline.total_active_minutes > 0 ? (
          <p className="text-sm text-stone-600">
            ~{timeline.total_active_minutes} min active cook time
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dayGroups.map((group) => (
          <div key={group.dayLabel} className="min-w-0 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--paprika))]">
              {group.dayLabel}
            </h3>
            <div className="space-y-2">
              {group.items.map((item, index) => (
                <TimelineCard
                  key={`${item.kind}-${item.recipe_id ?? item.title}-${index}`}
                  item={item}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
