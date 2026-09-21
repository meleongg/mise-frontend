"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SodieActionProposal } from "@/types";

function lineForItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const row = item as {
      name?: unknown;
      measure?: unknown;
      text?: unknown;
      step?: unknown;
    };
    if (row.text) {
      return `${row.step != null ? `${String(row.step)}. ` : ""}${String(row.text)}`;
    }
    if (row.name) {
      return `${row.measure ? `${String(row.measure)} ` : ""}${String(row.name)}`;
    }
  }
  return JSON.stringify(item);
}

function itemKey(item: unknown): string {
  if (typeof item === "string") return item.toLowerCase().trim();
  if (item && typeof item === "object") {
    const row = item as { name?: unknown; text?: unknown; step?: unknown };
    if (row.name) return String(row.name).toLowerCase().trim();
    if (row.text) return String(row.text).toLowerCase().trim();
    if (row.step != null) return `step:${row.step}`;
  }
  return lineForItem(item).toLowerCase();
}

/** For list fields, only show rows that were added, removed, or changed. */
function formatListDiff(before: unknown, after: unknown): {
  beforeText: string;
  afterText: string;
} {
  const beforeList = Array.isArray(before) ? before : [];
  const afterList = Array.isArray(after) ? after : [];
  const beforeByKey = new Map(beforeList.map((item) => [itemKey(item), item]));
  const afterByKey = new Map(afterList.map((item) => [itemKey(item), item]));

  const beforeLines: string[] = [];
  const afterLines: string[] = [];

  for (const [key, beforeItem] of beforeByKey) {
    const afterItem = afterByKey.get(key);
    if (afterItem == null) {
      beforeLines.push(lineForItem(beforeItem));
      continue;
    }
    const beforeLine = lineForItem(beforeItem);
    const afterLine = lineForItem(afterItem);
    if (beforeLine !== afterLine) {
      beforeLines.push(beforeLine);
      afterLines.push(afterLine);
    }
  }
  for (const [key, afterItem] of afterByKey) {
    if (!beforeByKey.has(key)) {
      afterLines.push(lineForItem(afterItem));
    }
  }

  return {
    beforeText: beforeLines.length ? beforeLines.join("\n") : "—",
    afterText: afterLines.length ? afterLines.join("\n") : "—",
  };
}

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(lineForItem).join("\n") || "—";
  }
  return JSON.stringify(value, null, 2);
}

const actionClass = "min-h-11 touch-manipulation text-sm font-semibold";

export default function ProposalCard({
  proposal,
  busy = false,
  onApprove,
  onReject,
}: {
  proposal: SodieActionProposal;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const fields = proposal.diff.fields ?? {};
  const pending = proposal.status === "pending";

  return (
    <article className="rounded-2xl border border-[hsl(var(--turmeric))]/40 bg-gradient-to-br from-amber-50 to-orange-50/70 p-4 text-sm shadow-sm">
      <header className="mb-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-stone-900">Recipe edit proposal</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              pending && "bg-[hsl(var(--turmeric))]/25 text-amber-900",
              proposal.status === "applied" &&
                "bg-[hsl(var(--sage))]/25 text-emerald-900",
              (proposal.status === "rejected" || proposal.status === "expired") &&
                "bg-stone-200 text-stone-700"
            )}
          >
            {proposal.status}
          </span>
        </div>
        {proposal.rationale && (
          <p className="text-sm leading-relaxed text-stone-600">
            {proposal.rationale}
          </p>
        )}
      </header>

      <div className="space-y-3">
        {Object.entries(fields).map(([field, change]) => {
          const isList =
            Array.isArray(change.before) || Array.isArray(change.after);
          const { beforeText, afterText } = isList
            ? formatListDiff(change.before, change.after)
            : {
                beforeText: formatValue(change.before),
                afterText: formatValue(change.after),
              };

          return (
            <div
              key={field}
              className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                {field}
                {isList ? " · changed only" : ""}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-stone-50 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Before
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-500 line-through decoration-stone-300">
                    {beforeText}
                  </p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--sage))]/10 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800/70">
                    After
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-900">
                    {afterText}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pending && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className={cn(
              actionClass,
              "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
            )}
            onClick={onReject}
          >
            Reject
          </Button>
          <Button
            type="button"
            disabled={busy}
            className={cn(
              actionClass,
              "bg-[hsl(var(--sage))] text-white hover:bg-[hsl(var(--sage))]/90"
            )}
            onClick={onApprove}
          >
            Approve
          </Button>
        </div>
      )}
    </article>
  );
}
