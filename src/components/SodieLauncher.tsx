"use client";

import ProposalCard from "@/components/ProposalCard";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { buildEditPatchFromRequest } from "@/lib/sodieEditPatch";
import { SODIE_START_RECIPE_EDIT_EVENT } from "@/lib/sodieEvents";
import type { SodieActionProposal } from "@/types";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChatItem =
  | { kind: "message"; sender: "user" | "ai"; content: string }
  | { kind: "proposal"; proposal: SodieActionProposal };

function recipeIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/recipe\/([^/]+)/);
  return match?.[1] ?? null;
}

const EDIT_PROMPT =
  "What would you like to change about this recipe? For example: add oatmeal, reduce sugar, or make the steps clearer. I’ll show a before/after proposal you can clarify, edit, reject, or approve.";

export default function SodieLauncher() {
  const pathname = usePathname();
  const recipeId = useMemo(() => recipeIdFromPath(pathname), [pathname]);
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

  async function send() {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setSending(true);
    setError("");
    setInput("");
    try {
      if (activeRecipeId) {
        const id = await ensureThread(activeRecipeId);
        setItems((old) => [
          ...old,
          { kind: "message", sender: "user", content: userText },
        ]);
        const recipe = await api.getRecipe(activeRecipeId);
        const patch = buildEditPatchFromRequest(recipe, userText);
        const response = await api.proposeRecipeEdit({
          source_recipe_id: activeRecipeId,
          thread_id: id,
          idempotency_key: `edit-${activeRecipeId}-${Date.now()}`,
          rationale: userText,
          patch,
        });
        setItems((old) => [
          ...old,
          {
            kind: "message",
            sender: "ai",
            content:
              "Here’s a personal-copy proposal based on what you asked for. Review the diff, then clarify, request another edit, reject, or approve.",
          },
          { kind: "proposal", proposal: response.proposal },
        ]);
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
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content: "Saved to My Recipes as a personal copy.",
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
          content: "Okay — that proposal was rejected. Tell me if you want a different change.",
        },
      ]);
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
        {
          kind: "message",
          sender: "ai",
          content:
            "Thanks — say more about what to change, or reject this proposal and send a new request.",
        },
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
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">Private session</p>
              <p className="text-xs text-stone-600 leading-snug">
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
          <Textarea
            className="mt-3"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              activeRecipeId
                ? "Describe the change… e.g. Add oatmeal"
                : "Ask about what you’re cooking…"
            }
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
