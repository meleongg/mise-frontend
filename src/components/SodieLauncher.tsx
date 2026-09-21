"use client";

import ProposalCard from "@/components/ProposalCard";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { queryKeys } from "@/hooks/queries";
import { api } from "@/lib/api";
import {
  SODIE_OPEN_EVENT,
  SODIE_START_RECIPE_EDIT_EVENT,
  type SodieOpenDetail,
} from "@/lib/sodieEvents";
import { cn } from "@/lib/utils";
import type { SodieActionProposal, SodieStoredMessage, SodieThread } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { History, Plus, Trash2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatItem =
  | { kind: "message"; sender: "user" | "ai"; content: string }
  | { kind: "proposal"; proposal: SodieActionProposal };

type PageScope = "global" | "plan" | "recipe" | "kitchen" | "shopping";
type PanelView = "chat" | "history";

function recipeIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/recipe\/([^/]+)/);
  return match?.[1] ?? null;
}

function pageContextFromPath(
  pathname: string,
  currentWeek: number
): { scope: PageScope; contextId?: string } {
  if (pathname.startsWith("/weekly-plan")) {
    return {
      scope: "plan",
      contextId: currentWeek > 0 ? String(currentWeek) : undefined,
    };
  }
  const cookMatch = pathname.match(/^\/recipe\/([^/]+)\/cook/);
  if (cookMatch) {
    return { scope: "kitchen", contextId: cookMatch[1] };
  }
  const recipeMatch = pathname.match(/^\/recipe\/([^/]+)/);
  if (recipeMatch) {
    return { scope: "recipe", contextId: recipeMatch[1] };
  }
  if (pathname.startsWith("/shopping")) {
    return { scope: "shopping" };
  }
  return { scope: "global" };
}

function messagesToItems(messages: SodieStoredMessage[]): ChatItem[] {
  return messages.map((message) => ({
    kind: "message" as const,
    sender: message.sender,
    content: message.content,
  }));
}

function threadPreview(thread: SodieThread): string {
  const firstUser = thread.messages.find((m) => m.sender === "user");
  if (firstUser?.content) return firstUser.content;
  const first = thread.messages[0];
  if (first?.content) return first.content;
  return "Empty chat";
}

function formatThreadTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

const SCOPE_LABEL: Record<PageScope, string> = {
  global: "Cooking help for your plan",
  plan: "Helping with this week’s plan",
  recipe: "Helping with this recipe",
  kitchen: "Kitchen Mode help",
  shopping: "Shopping help",
};

const SCOPE_SHORT: Record<string, string> = {
  global: "General",
  plan: "Weekly plan",
  recipe: "Recipe",
  kitchen: "Kitchen",
  shopping: "Shopping",
};

const EDIT_PROMPT =
  "What would you like to change about this recipe? I’ll show a before/after proposal you can reject or approve. Keep chatting if you want to tweak it.";

export default function SodieLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useApp();
  const queryClient = useQueryClient();
  const recipeId = useMemo(() => recipeIdFromPath(pathname), [pathname]);
  const pageContext = useMemo(
    () => pageContextFromPath(pathname, state.currentWeek),
    [pathname, state.currentWeek]
  );
  const transcriptRef = useRef<HTMLDivElement>(null);
  const skipAutoResumeRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>("chat");
  const [temporary, setTemporary] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadScopeKey, setThreadScopeKey] = useState<string | null>(null);
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SodieThread[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [resuming, setResuming] = useState(false);

  const activeRecipeId = editRecipeId || recipeId;
  const pageScopeKey = `${pageContext.scope}:${pageContext.contextId ?? ""}`;

  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [items, open, view]);

  // Re-scope on navigation so chat does not keep a stale global/recipe thread.
  useEffect(() => {
    if (editRecipeId) return;
    skipAutoResumeRef.current = false;
    if (threadScopeKey && threadScopeKey !== pageScopeKey) {
      setThreadId(null);
      setThreadScopeKey(null);
      setItems([]);
      setError("");
      setInput("");
      setView("chat");
    }
  }, [pageScopeKey, threadScopeKey, editRecipeId]);

  function applyThread(thread: SodieThread) {
    setThreadId(thread.id);
    setThreadScopeKey(`${thread.scope}:${thread.context_id ?? ""}`);
    setTemporary(Boolean(thread.is_temporary));
    setEditRecipeId(null);
    setItems(messagesToItems(thread.messages ?? []));
    setError("");
    setView("chat");
  }

  async function resumeMatchingThread() {
    if (temporary || editRecipeId || skipAutoResumeRef.current) return;
    setResuming(true);
    setError("");
    try {
      const matches = await api.listSodieThreads({
        scope: pageContext.scope,
        ...(pageContext.contextId
          ? { context_id: pageContext.contextId }
          : {}),
      });
      const latest = matches[0];
      if (!latest) return;
      // Prefer a full get so message order is authoritative.
      const full = await api.getSodieThread(latest.id);
      applyThread(full);
    } catch {
      // Stay on empty chat if history cannot load.
    } finally {
      setResuming(false);
    }
  }

  // Auto-resume durable thread for this page when opening the panel.
  useEffect(() => {
    if (!open || temporary || editRecipeId || threadId || view !== "chat") return;
    void resumeMatchingThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when panel opens / scope clears thread
  }, [open, temporary, editRecipeId, threadId, pageScopeKey, view]);

  async function loadHistory() {
    setHistoryLoading(true);
    setError("");
    try {
      setHistory(await api.listSodieThreads());
    } catch {
      setError("Could not load chat history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function openHistory() {
    setView("history");
    await loadHistory();
  }

  function startNewChat() {
    skipAutoResumeRef.current = true;
    setThreadId(null);
    setThreadScopeKey(null);
    setItems([]);
    setError("");
    setInput("");
    setEditRecipeId(null);
    setView("chat");
  }

  async function selectHistoryThread(id: string) {
    setResuming(true);
    setError("");
    try {
      const full = await api.getSodieThread(id);
      skipAutoResumeRef.current = false;
      applyThread(full);
    } catch {
      setError("Could not open that chat.");
    } finally {
      setResuming(false);
    }
  }

  async function deleteHistoryThread(id: string) {
    setError("");
    try {
      await api.deleteSodieThread(id);
      if (threadId === id) startNewChat();
      setHistory((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Could not delete that chat.");
    }
  }

  async function ensureThread(forRecipeId?: string | null) {
    if (threadId) return threadId;
    if (!temporary && !forRecipeId && !skipAutoResumeRef.current) {
      try {
        const matches = await api.listSodieThreads({
          scope: pageContext.scope,
          ...(pageContext.contextId
            ? { context_id: pageContext.contextId }
            : {}),
        });
        if (matches[0]) {
          const full = await api.getSodieThread(matches[0].id);
          applyThread(full);
          return full.id;
        }
      } catch {
        /* create below */
      }
    }
    const scopeRecipeId = forRecipeId || activeRecipeId;
    const scope: PageScope = scopeRecipeId
      ? pageContext.scope === "kitchen"
        ? "kitchen"
        : "recipe"
      : pageContext.scope;
    const contextId = scopeRecipeId || pageContext.contextId;
    const thread = await api.createSodieThread(scope, temporary, contextId);
    setThreadId(thread.id);
    setThreadScopeKey(`${scope}:${contextId ?? ""}`);
    skipAutoResumeRef.current = false;
    return thread.id;
  }

  function startRecipeEdit(targetRecipeId: string) {
    skipAutoResumeRef.current = true;
    setOpen(true);
    setView("chat");
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
    setThreadScopeKey(null);
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

    const proposal = response.proposal;
    const assistantMessage =
      response.assistant_message || "Here’s a proposal from what you asked for.";
    setItems((old) => [
      ...old.filter(
        (item) =>
          !(replacedId && item.kind === "proposal" && item.proposal.id === replacedId)
      ),
      {
        kind: "message",
        sender: "ai",
        content: assistantMessage,
      },
      { kind: "proposal", proposal },
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
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<SodieOpenDetail>).detail ?? {};
      setOpen(true);
      setView("chat");
      setEditRecipeId(null);
      setError("");
      if (typeof detail.draft === "string") {
        setInput(detail.draft);
      }
    }
    window.addEventListener(SODIE_START_RECIPE_EDIT_EVENT, onStartRecipeEdit);
    window.addEventListener(SODIE_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(SODIE_START_RECIPE_EDIT_EVENT, onStartRecipeEdit);
      window.removeEventListener(SODIE_OPEN_EVENT, onOpen);
    };
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
                  {view === "history"
                    ? "Saved chats (private sessions stay out)"
                    : activeRecipeId
                      ? "Editing this recipe — personal copy on approve"
                      : SCOPE_LABEL[pageContext.scope]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {view === "chat" && !temporary && !editRecipeId && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="min-h-11 min-w-11"
                    onClick={() => void openHistory()}
                    aria-label="Chat history"
                  >
                    <History className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="min-h-11 min-w-11"
                    onClick={startNewChat}
                    aria-label="New chat"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </>
              )}
              {view === "history" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="min-h-11 min-w-11"
                  onClick={() => setView("chat")}
                  aria-label="Back to chat"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
              {view === "chat" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="min-h-11 min-w-11"
                  onClick={() => setOpen(false)}
                  aria-label="Close Sodie"
                >
                  <X />
                </Button>
              )}
            </div>
          </header>

          {view === "chat" && (
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
                onCheckedChange={(next) => {
                  setTemporary(next);
                  if (next) {
                    skipAutoResumeRef.current = true;
                    setThreadId(null);
                    setThreadScopeKey(null);
                    setItems([]);
                  } else {
                    skipAutoResumeRef.current = false;
                  }
                }}
              />
            </div>
          )}

          {view === "history" ? (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {historyLoading || resuming ? (
                <p className="text-sm text-stone-500">Loading…</p>
              ) : history.length === 0 ? (
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-stone-700">
                  No saved chats yet. Turn off private session and send a message
                  to start one.
                </p>
              ) : (
                history.map((thread) => (
                  <div
                    key={thread.id}
                    className="flex items-stretch gap-1 rounded-2xl border border-stone-200/80 bg-stone-50/80"
                  >
                    <button
                      type="button"
                      onClick={() => void selectHistoryThread(thread.id)}
                      className="min-w-0 flex-1 px-3 py-3 text-left transition-colors hover:bg-white"
                    >
                      <p className="text-xs font-medium text-[hsl(var(--paprika))]">
                        {SCOPE_SHORT[thread.scope] ?? thread.scope}
                        {thread.context_id ? ` · ${thread.context_id.slice(0, 8)}` : ""}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-stone-800">
                        {threadPreview(thread)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatThreadTime(thread.updated_at)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteHistoryThread(thread.id)}
                      className="shrink-0 px-3 text-stone-400 transition-colors hover:text-red-600"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          ) : (
            <>
              <div
                ref={transcriptRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
              >
                {resuming && items.length === 0 && (
                  <p className="text-sm text-stone-500">Restoring your chat…</p>
                )}
                {!resuming && items.length === 0 && (
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
                      ? "e.g. Scale for 2 more people, or make steps clearer"
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
                <p className="mt-3 text-xs leading-snug text-stone-500">
                  Sodie uses AI and can make mistakes. Double-check recipes,
                  allergens, and instructions before you cook.
                </p>
              </div>
            </>
          )}
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
