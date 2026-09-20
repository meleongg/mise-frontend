"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SodieActionProposal } from "@/types";
import { useState } from "react";

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function ProposalCard({
  proposal,
  busy = false,
  onApprove,
  onReject,
  onClarify,
  onEditRequest,
}: {
  proposal: SodieActionProposal;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClarify: (content: string) => void;
  onEditRequest: (content: string) => void;
}) {
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState("");
  const fields = proposal.diff.fields ?? {};
  const pending = proposal.status === "pending";

  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm">
      <header className="mb-2">
        <p className="font-semibold text-stone-900">Recipe edit proposal</p>
        <p className="text-xs text-stone-600">
          {proposal.rationale || "Sodie prepared a personal copy for your review."}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
          Status: {proposal.status}
        </p>
      </header>

      <div className="space-y-2">
        {Object.entries(fields).map(([field, change]) => (
          <div key={field} className="rounded-lg bg-white/80 p-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {field}
            </p>
            <p className="mt-1 text-stone-500 line-through whitespace-pre-wrap">
              {formatValue(change.before)}
            </p>
            <p className="mt-1 text-stone-900 whitespace-pre-wrap">
              {formatValue(change.after)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-stone-600">
        {proposal.impact.serving_text}
        {" · "}
        Plan schedule: {proposal.impact.plan_schedule || "unchanged"}
        {" · "}
        Shopping: {proposal.impact.shopping_list || "deferred"}
      </p>

      {pending && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditOpen(false);
                setClarifyOpen((open) => !open);
              }}
            >
              Clarify
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setClarifyOpen(false);
                setEditOpen((open) => !open);
              }}
            >
              Edit request
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onReject}
            >
              Reject
            </Button>
            <Button size="sm" disabled={busy} onClick={onApprove}>
              Approve
            </Button>
          </div>
          {(clarifyOpen || editOpen) && (
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  clarifyOpen
                    ? "What should Sodie clarify?"
                    : "What should change in this proposal?"
                }
              />
              <Button
                size="sm"
                className="w-full"
                disabled={busy || !note.trim()}
                onClick={() => {
                  const content = note.trim();
                  if (clarifyOpen) onClarify(content);
                  else onEditRequest(content);
                  setNote("");
                  setClarifyOpen(false);
                  setEditOpen(false);
                }}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
