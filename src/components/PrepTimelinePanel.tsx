"use client";

import { PrepTimeline, PrepTimelineItem } from "@/types";
import { cn } from "@/lib/utils";
import { Clock3, CookingPot, ShoppingBasket, Sparkles } from "lucide-react";
import { useMemo } from "react";

const KIND_ICON = {
  shop: ShoppingBasket,
  advance_prep: Sparkles,
  cook: CookingPot,
} as const;

/** Soft brand accents only — paprika / sage / turmeric — not a rainbow per day. */
const KIND_STYLE = {
  shop: {
    card: "border-[hsl(var(--turmeric))]/30 bg-amber-50/60",
    icon: "border-[hsl(var(--turmeric))]/35 bg-[hsl(var(--turmeric))]/10 text-amber-900",
    chip: "bg-amber-100/80 text-amber-900",
  },
  advance_prep: {
    card: "border-[hsl(var(--sage))]/30 bg-[hsl(var(--sage))]/8",
    icon: "border-[hsl(var(--sage))]/35 bg-[hsl(var(--sage))]/12 text-[hsl(var(--sage))]",
    chip: "bg-[hsl(var(--sage))]/15 text-[hsl(var(--sage))]",
  },
  cook: {
    card: "border-[hsl(var(--paprika))]/25 bg-orange-50/50",
    icon: "border-[hsl(var(--paprika))]/30 bg-[hsl(var(--paprika))]/10 text-[hsl(var(--paprika))]",
    chip: "bg-[hsl(var(--paprika))]/10 text-[hsl(var(--paprika))]",
  },
} as const;

function kindStyle(kind: string) {
  if (kind === "shop" || kind === "advance_prep" || kind === "cook") {
    return KIND_STYLE[kind];
  }
  return KIND_STYLE.cook;
}

function TimelineCard({ item }: { item: PrepTimelineItem }) {
  const Icon =
    item.kind === "shop" || item.kind === "advance_prep" || item.kind === "cook"
      ? KIND_ICON[item.kind]
      : Clock3;
  const style = kindStyle(item.kind);
  return (
    <article className={cn("rounded-lg border p-2.5", style.card)}>
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border",
            style.icon
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {item.duration_minutes != null ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              style.chip
            )}
          >
            ~{item.duration_minutes} min
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium leading-snug text-stone-900">{item.title}</p>
      <p className="mt-0.5 text-xs leading-snug text-stone-600">{item.detail}</p>
      {item.reasons?.length ? (
        <ul className="mt-1.5 space-y-0.5">
          {item.reasons.slice(0, 2).map((reason) => (
            <li key={reason} className="text-[11px] leading-snug text-stone-500">
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
  const manyDays = dayGroups.length >= 5;

  return (
    <section
      className="mt-6 rounded-xl border border-[hsl(var(--paprika))]/25 bg-white/90 px-4 py-4 shadow-sm"
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
            {manyDays ? " · swipe to see all days" : ""}
          </p>
        </div>
        {timeline.total_active_minutes > 0 ? (
          <p className="text-sm text-stone-600">
            ~{timeline.total_active_minutes} min active
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

      <div className="-mx-1 overflow-x-auto pb-1">
        <div
          className="flex min-h-[14rem] items-stretch gap-3 px-1"
          style={{
            minWidth: manyDays ? `${dayGroups.length * 11}rem` : undefined,
          }}
        >
          {dayGroups.map((group) => (
            <div
              key={group.dayLabel}
              className="flex w-[10.5rem] shrink-0 flex-col rounded-xl border border-[hsl(var(--paprika))]/20 bg-gradient-to-b from-orange-50/40 to-white p-2.5 sm:w-44"
            >
              <h3 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--paprika))]">
                {group.dayLabel}
              </h3>
              <div className="flex flex-1 flex-col gap-2">
                {group.items.map((item, index) => (
                  <TimelineCard
                    key={`${item.kind}-${item.recipe_id ?? item.title}-${index}`}
                    item={item}
                  />
                ))}
                <div className="flex-1" aria-hidden />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
