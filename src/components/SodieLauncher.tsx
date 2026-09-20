"use client";

import ProposalCard from "@/components/ProposalCard";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { SodieActionProposal } from "@/types";
import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SODIE_PROPOSE_EDIT_EVENT } from "@/lib/sodieEvents";

type ChatItem =
  | { kind: "message"; sender: "user" | "ai"; content: string }
  | { kind: "proposal"; proposal: SodieActionProposal };

function recipeIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/recipe\/([^/]+)/);
  return match?.[1] ?? null;
}

export default function SodieLauncher() {
  const pathname = usePathname();
  const recipeId = useMemo(() => recipeIdFromPath(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [error, setError] = useState("");

  async function ensureThread(forRecipeId?: string | null) {
    if (threadId) return threadId;
    const scopeRecipeId = forRecipeId || recipeId;
    const thread = await api.createSodieThread(
      scopeRecipeId ? "recipe" : "global",
      temporary,
      scopeRecipeId || undefined
    );
    setThreadId(thread.id);
    return thread.id;
  }

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const id = await ensureThread();
      const response = await api.sendSodieMessage(id, input.trim());
      setItems((old) => [
        ...old,
        { kind: "message", sender: "user", content: response.user_message.content },
        { kind: "message", sender: "ai", content: response.ai_message.content },
        ...(response.proposal
          ? [{ kind: "proposal" as const, proposal: response.proposal }]
          : []),
      ]);
      setInput("");
    } catch {
      setError("Sodie could not reply just now. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function proposePersonalEdit(forRecipeId?: string) {
    const targetRecipeId = forRecipeId || recipeId;
    if (!targetRecipeId || sending) return;
    setOpen(true);
    setSending(true);
    setError("");
    try {
      const id = await ensureThread(targetRecipeId);
      const recipe = await api.getRecipe(targetRecipeId);
      const response = await api.proposeRecipeEdit({
        source_recipe_id: targetRecipeId,
        thread_id: id,
        idempotency_key: `ui-${targetRecipeId}-${Date.now()}`,
        rationale: "Personal copy with a weeknight-friendly note from Sodie.",
        patch: {
          title: `${recipe.name} (personal)`,
          notes: "Adjusted for your kitchen — review before saving.",
          servings: recipe.portion_size || "4 servings",
        },
      });
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content:
            response.assistant_message ||
            "I prepared a personal recipe edit for your review.",
        },
        { kind: "proposal", proposal: response.proposal },
      ]);
    } catch {
      setError("Could not create a proposal. Try again.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    function onProposeEdit(event: Event) {
      const detail = (event as CustomEvent<{ recipeId?: string }>).detail;
      if (!detail?.recipeId) return;
      void proposePersonalEdit(detail.recipeId);
    }
    window.addEventListener(SODIE_PROPOSE_EDIT_EVENT, onProposeEdit);
    return () => window.removeEventListener(SODIE_PROPOSE_EDIT_EVENT, onProposeEdit);
    // Re-bind when path/thread state changes so the handler uses current closures.
  }, [recipeId, temporary, threadId, sending]);

  function replaceProposal(next: SodieActionProposal) {
    setItems((old) =>
      old.map((item) =>
        item.kind === "proposal" && item.proposal.id === next.id
          ? { kind: "proposal", proposal: next }
          : item
      )
    );
  }

  async function approve(proposalId: string) {
    setProposalBusy(true);
    setError("");
    try {
      const next = await api.approveSodieProposal(proposalId);
      replaceProposal(next);
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content:
            "Saved to My Recipes as a personal copy.",
        },
      ]);
    } catch {
      setError("Approval failed. The proposal may be stale or already handled.");
    } finally {
      setProposalBusy(false);
    }
  }

  async function reject(proposalId: string) {
    setProposalBusy(true);
    setError("");
    try {
      replaceProposal(await api.rejectSodieProposal(proposalId));
    } catch {
      setError("Could not reject that proposal.");
    } finally {
      setProposalBusy(false);
    }
  }

  async function clarify(proposalId: string, content: string) {
    setProposalBusy(true);
    setError("");
    try {
      const message = await api.clarifySodieProposal(proposalId, content);
      setItems((old) => [
        ...old,
        { kind: "message", sender: "user", content: message.content },
      ]);
    } catch {
      setError("Could not send that clarification.");
    } finally {
      setProposalBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <SodieAvatar size="sm" animate="none" />
              <strong>Ask Sodie</strong>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(false)}
              aria-label="Close Sodie"
            >
              <X />
            </Button>
          </div>
          <label className="mt-3 flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={temporary}
              disabled={!!threadId}
              onChange={(event) => setTemporary(event.target.checked)}
            />
            Private session — not shown in history or used for memory
          </label>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {items.map((item, index) =>
              item.kind === "message" ? (
                <p
                  key={`m-${index}`}
                  className={
                    item.sender === "ai"
                      ? "rounded bg-amber-50 p-2 text-sm"
                      : "rounded bg-primary p-2 text-sm text-white"
                  }
                >
                  {item.content}
                </p>
              ) : (
                <ProposalCard
                  key={item.proposal.id}
                  proposal={item.proposal}
                  busy={proposalBusy}
                  onApprove={() => void approve(item.proposal.id)}
                  onReject={() => void reject(item.proposal.id)}
                  onClarify={(content) => void clarify(item.proposal.id, content)}
                  onEditRequest={(content) => void clarify(item.proposal.id, content)}
                />
              )
            )}
          </div>
          {recipeId && (
            <Button
              variant="outline"
              className="mt-3 w-full"
              disabled={sending}
              onClick={() => void proposePersonalEdit()}
            >
              Propose edit for this recipe
            </Button>
          )}
          <Textarea
            className="mt-3"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about what you’re cooking…"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <Button
            className="mt-2 w-full"
            disabled={!input.trim() || sending}
            onClick={() => void send()}
          >
            {sending ? "Sodie is thinking…" : "Send"}
          </Button>
        </section>
      )}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full"
        onClick={() => setOpen(!open)}
        aria-label="Open Sodie chat"
      >
        <MessageCircle />
      </Button>
    </div>
  );
}
