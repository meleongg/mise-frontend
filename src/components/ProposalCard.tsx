"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SodieActionProposal } from "@/types";

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const row = item as { name?: unknown; measure?: unknown; text?: unknown };
          if (row.text) return String(row.text);
          if (row.name) {
            return `${row.measure ? `${String(row.measure)} ` : ""}${String(row.name)}`;
          }
        }
        return JSON.stringify(item);
      })
      .join("\n");
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
        {Object.entries(fields).map(([field, change]) => (
          <div
            key={field}
            className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              {field}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-stone-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                  Before
                </p>
                <p className="mt-1 whitespace-pre-wrap text-stone-500 line-through decoration-stone-300">
                  {formatValue(change.before)}
                </p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--sage))]/10 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800/70">
                  After
                </p>
                <p className="mt-1 whitespace-pre-wrap text-stone-900">
                  {formatValue(change.after)}
                </p>
              </div>
            </div>
          </div>
        ))}
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
