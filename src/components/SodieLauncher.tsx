"use client";

import ProposalCard from "@/components/ProposalCard";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/hooks/queries";
import { api } from "@/lib/api";
import { SODIE_START_RECIPE_EDIT_EVENT } from "@/lib/sodieEvents";
import { cn } from "@/lib/utils";
import type { SodieActionProposal } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatItem =
  | { kind: "message"; sender: "user" | "ai"; content: string }
  | { kind: "proposal"; proposal: SodieActionProposal };

function recipeIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/recipe\/([^/]+)/);
  return match?.[1] ?? null;
}

const EDIT_PROMPT =
  "What would you like to change about this recipe? I’ll show a before/after proposal you can reject or approve. Keep chatting if you want to tweak it.";

export default function SodieLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const recipeId = useMemo(() => recipeIdFromPath(pathname), [pathname]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [error, setError] = useState("");

  const activeRecipeId = editRecipeId || recipeId;

  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [items, open]);

  async function ensureThread(forRecipeId?: string | null) {
    if (threadId) return threadId;
    const scopeRecipeId = forRecipeId || activeRecipeId;
    const thread = await api.createSodieThread(
      scopeRecipeId ? "recipe" : "global",
      temporary,
      scopeRecipeId || undefined
    );
    setThreadId(thread.id);
    return thread.id;
  }

  function startRecipeEdit(targetRecipeId: string) {
    setOpen(true);
    setEditRecipeId(targetRecipeId);
    setError("");
    setItems([
      {
        kind: "message",
        sender: "ai",
        content: EDIT_PROMPT,
      },
    ]);
    // New edit session should not reuse an old global thread.
    setThreadId(null);
  }

  const pendingProposal = [...items]
    .reverse()
    .find(
      (item): item is { kind: "proposal"; proposal: SodieActionProposal } =>
        item.kind === "proposal" && item.proposal.status === "pending"
    );

  async function handleEditFollowUp(userText: string) {
    if (!activeRecipeId) return;
    const id = await ensureThread(activeRecipeId);
    const replacedId = pendingProposal?.proposal.id;
    const response = await api.proposeRecipeEditFromRequest({
      source_recipe_id: activeRecipeId,
      thread_id: id,
      idempotency_key: `edit-${activeRecipeId}-${Date.now()}`,
      request: userText,
      pending_proposal_id: replacedId,
    });

    if (response.kind === "clarify" || response.kind === "needs_more_info") {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content:
            response.assistant_message ||
            "Tell me the change you want and I’ll draft a proposal.",
        },
      ]);
      return;
    }

    if (!response.proposal) {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content: "I couldn’t draft that edit — try naming a concrete change.",
        },
      ]);
      return;
    }

    setItems((old) => [
      ...old.filter(
        (item) =>
          !(replacedId && item.kind === "proposal" && item.proposal.id === replacedId)
      ),
      {
        kind: "message",
        sender: "ai",
        content:
          response.assistant_message || "Here’s a proposal from what you asked for.",
      },
      { kind: "proposal", proposal: response.proposal },
    ]);
  }

  async function send() {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setSending(true);
    setError("");
    setInput("");
    try {
      if (activeRecipeId) {
        setItems((old) => [
          ...old,
          { kind: "message", sender: "user", content: userText },
        ]);
        await handleEditFollowUp(userText);
        return;
      }

      const id = await ensureThread();
      const response = await api.sendSodieMessage(id, userText);
      setItems((old) => [
        ...old,
        { kind: "message", sender: "user", content: response.user_message.content },
        { kind: "message", sender: "ai", content: response.ai_message.content },
        ...(response.proposal
          ? [{ kind: "proposal" as const, proposal: response.proposal }]
          : []),
      ]);
    } catch {
      setError("Sodie could not reply just now. Try again.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    function onStartRecipeEdit(event: Event) {
      const detail = (event as CustomEvent<{ recipeId?: string }>).detail;
      if (!detail?.recipeId) return;
      startRecipeEdit(detail.recipeId);
    }
    window.addEventListener(SODIE_START_RECIPE_EDIT_EVENT, onStartRecipeEdit);
    return () =>
      window.removeEventListener(SODIE_START_RECIPE_EDIT_EVENT, onStartRecipeEdit);
  }, []);

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.personalRecipes() });
      if (next.personal_recipe_id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.personalRecipe(next.personal_recipe_id),
        });
        router.push(`/my-recipes/${next.personal_recipe_id}`);
      }
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content: "Agreed — saved to My Recipes. Anything else?",
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
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content: "Got it — nothing saved. How else should we change it?",
        },
      ]);
    } catch {
      setError("Could not reject that proposal.");
    } finally {
      setProposalBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <section
          className={cn(
            "mb-3 flex max-h-[min(40rem,calc(100dvh-7.5rem))] w-[min(28rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xl",
            "sm:w-[min(32rem,calc(100vw-2.5rem))]"
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <SodieAvatar size="sm" animate="none" />
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">Ask Sodie</p>
                <p className="truncate text-xs text-stone-500">
                  {activeRecipeId
                    ? "Editing this recipe — personal copy on approve"
                    : "Cooking help for your plan"}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="min-h-11 min-w-11 shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Close Sodie"
            >
              <X />
            </Button>
          </header>

          <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">Private session</p>
              <p className="text-xs leading-snug text-stone-600">
                Not shown in history or used for memory
              </p>
            </div>
            <Switch
              checked={temporary}
              disabled={!!threadId}
              aria-label="Private session"
              onCheckedChange={setTemporary}
            />
          </div>

          <div
            ref={transcriptRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
          >
            {items.length === 0 && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-stone-700">
                Ask about prep, timing, or techniques — or open a recipe and tap{" "}
                <strong>Edit with Sodie</strong> to change ingredients.
              </p>
            )}
            {items.map((item, index) =>
              item.kind === "message" ? (
                <p
                  key={`m-${index}`}
                  className={cn(
                    "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    item.sender === "ai"
                      ? "bg-amber-50 text-stone-800"
                      : "ml-auto bg-[hsl(var(--paprika))] text-white"
                  )}
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
                />
              )
            )}
          </div>

          <div className="border-t border-stone-100 bg-stone-50/80 px-4 py-3 sm:px-5 sm:py-4">
            <Textarea
              className="min-h-24 resize-none border-stone-200 bg-white text-sm leading-relaxed shadow-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!sending && input.trim()) void send();
                }
              }}
              placeholder={
                activeRecipeId
                  ? "e.g. Less sugar, or add oatmeal"
                  : "Ask about what you’re cooking…"
              }
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <Button
              className="mt-3 min-h-11 w-full bg-[hsl(var(--paprika))] text-white hover:bg-[hsl(var(--paprika))]/90"
              disabled={!input.trim() || sending}
              onClick={() => void send()}
            >
              {sending ? "Sodie is thinking…" : "Send"}
            </Button>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close Sodie chat" : "Open Sodie chat"}
        aria-expanded={open}
        className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-lg ring-2 ring-white transition hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(var(--paprika))]/35"
      >
        <SodieAvatar size="sm" animate={open ? "none" : "idle"} className="drop-shadow-sm" />
      </button>
    </div>
  );
}
