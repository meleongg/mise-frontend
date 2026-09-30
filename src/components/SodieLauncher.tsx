"use client";

import ProposalCard from "@/components/ProposalCard";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import { queryKeys } from "@/hooks/queries";
import { api } from "@/lib/api";
import {
  SodieMarkdown,
  threadHistoryLabel,
} from "@/lib/sodieFormat";
import {
  SODIE_KITCHEN_STATE_EVENT,
  SODIE_OPEN_EVENT,
  SODIE_START_RECIPE_EDIT_EVENT,
  type SodieKitchenState,
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

type PageScope =
  | "global"
  | "plan"
  | "recipe"
  | "kitchen"
  | "shopping"
  | "personal_recipe"
  | "settings"
  | "analytics";
type PanelView = "chat" | "history";

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
  const personalMatch = pathname.match(/^\/my-recipes\/([^/]+)/);
  if (personalMatch) {
    return { scope: "personal_recipe", contextId: personalMatch[1] };
  }
  if (pathname.startsWith("/my-recipes")) {
    return { scope: "personal_recipe" };
  }
  if (
    pathname.startsWith("/settings/preferences") ||
    pathname.startsWith("/settings/account")
  ) {
    return { scope: "settings" };
  }
  if (pathname.startsWith("/analytics")) {
    return { scope: "analytics" };
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
  personal_recipe: "Helping with your My Recipes copy",
  settings: "Settings help (private)",
  analytics: "Talking about your cooking progress",
};

const EDIT_PROMPT =
  "What would you like to change about this recipe? I’ll show a before/after proposal you can reject or approve. Keep chatting if you want to tweak it.";

export default function SodieLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useApp();
  const { user, setUser } = useUser();
  const queryClient = useQueryClient();
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
  const [historyLabels, setHistoryLabels] = useState<Record<string, string>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SodieThread | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [kitchenState, setKitchenState] = useState<SodieKitchenState | null>(
    null
  );

  // Explicit Edit-with-Sodie session only — recipe pages default to coach chat.
  const editingRecipeId = editRecipeId;
  const pageScopeKey = `${pageContext.scope}:${pageContext.contextId ?? ""}`;
  const prevPageScopeKeyRef = useRef(pageScopeKey);
  // Settings routes never get durable coach context or history.
  const forcePrivate = pageContext.scope === "settings";
  const isPrivate = temporary || forcePrivate;

  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [items, open, view]);

  // Edit with Sodie is recipe-page only: drop the session when leaving /recipe.
  useEffect(() => {
    if (pageContext.scope !== "recipe" && editRecipeId) {
      setEditRecipeId(null);
    }
  }, [pageContext.scope, editRecipeId]);

  // Re-scope on navigation so chat does not keep a stale global/recipe thread.
  // Only clear skipAutoResume when the *page* changes — New chat clears
  // threadScopeKey and must not immediately re-attach the previous durable thread.
  useEffect(() => {
    if (editingRecipeId) return;
    const pageChanged = prevPageScopeKeyRef.current !== pageScopeKey;
    prevPageScopeKeyRef.current = pageScopeKey;
    if (pageChanged) {
      skipAutoResumeRef.current = false;
    }
    if (threadScopeKey && threadScopeKey !== pageScopeKey) {
      setThreadId(null);
      setThreadScopeKey(null);
      setItems([]);
      setError("");
      setInput("");
      setView("chat");
    }
  }, [pageScopeKey, threadScopeKey, editingRecipeId]);

  async function applyThread(thread: SodieThread) {
    setThreadId(thread.id);
    setThreadScopeKey(`${thread.scope}:${thread.context_id ?? ""}`);
    setTemporary(Boolean(thread.is_temporary));
    setEditRecipeId(null);
    const messageItems = messagesToItems(thread.messages ?? []);
    setItems(messageItems);
    setError("");
    setView("chat");

    // Reconstitute pending proposal cards (messages alone don't include them).
    try {
      const pending = await api.listSodieThreadProposals(thread.id, {
        status: "pending",
      });
      if (pending.length === 0) return;
      setItems((prev) => {
        const existingIds = new Set(
          prev
            .filter(
              (item): item is { kind: "proposal"; proposal: SodieActionProposal } =>
                item.kind === "proposal"
            )
            .map((item) => item.proposal.id)
        );
        const extras = pending
          .filter((proposal) => !existingIds.has(proposal.id))
          .map((proposal) => ({ kind: "proposal" as const, proposal }));
        return extras.length ? [...prev, ...extras] : prev;
      });
    } catch {
      /* resume messages even if proposal list fails */
    }
  }

  async function resumeMatchingThread() {
    if (isPrivate || editingRecipeId || skipAutoResumeRef.current) return;
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
      await applyThread(full);
    } catch {
      // Stay on empty chat if history cannot load.
    } finally {
      setResuming(false);
    }
  }

  // Auto-resume durable thread for this page when opening the panel.
  useEffect(() => {
    if (!open || isPrivate || editingRecipeId || threadId || view !== "chat")
      return;
    if (skipAutoResumeRef.current) return;
    void resumeMatchingThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when panel opens / scope clears thread
  }, [open, isPrivate, editingRecipeId, threadId, pageScopeKey, view]);

  async function loadHistory() {
    setHistoryLoading(true);
    setError("");
    try {
      const threads = await api.listSodieThreads();
      setHistory(threads);
      const labelTargets = [
        ...new Map(
          threads
            .filter(
              (t) =>
                (t.scope === "recipe" ||
                  t.scope === "kitchen" ||
                  t.scope === "personal_recipe") &&
                t.context_id
            )
            .map((t) => [`${t.scope}:${t.context_id}`, t] as const)
        ).values(),
      ];
      const names: Record<string, string> = {};
      await Promise.all(
        labelTargets.map(async (thread) => {
          const id = thread.context_id as string;
          try {
            if (thread.scope === "personal_recipe") {
              const personal = await api.getPersonalRecipe(id);
              if (personal?.name) names[id] = personal.name;
            } else {
              const recipe = await api.getRecipe(id);
              if (recipe?.name) names[id] = recipe.name;
            }
          } catch {
            /* keep generic Recipe/Kitchen/My Recipes label */
          }
        })
      );
      setHistoryLabels(names);
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
      await applyThread(full);
    } catch {
      setError("Could not open that chat.");
    } finally {
      setResuming(false);
    }
  }

  async function confirmDeleteHistoryThread() {
    if (!pendingDelete || deleteBusy) return;
    const id = pendingDelete.id;
    setDeleteBusy(true);
    setError("");
    try {
      await api.deleteSodieThread(id);
      if (threadId === id) startNewChat();
      setHistory((prev) => prev.filter((t) => t.id !== id));
      setPendingDelete(null);
    } catch {
      setError("Could not delete that chat. Check your connection and try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function ensureThread(forRecipeId?: string | null) {
    if (threadId) return threadId;
    if (!isPrivate && !forRecipeId && !skipAutoResumeRef.current) {
      try {
        const matches = await api.listSodieThreads({
          scope: pageContext.scope,
          ...(pageContext.contextId
            ? { context_id: pageContext.contextId }
            : {}),
        });
        if (matches[0]) {
          const full = await api.getSodieThread(matches[0].id);
          await applyThread(full);
          return full.id;
        }
      } catch {
        /* create below */
      }
    }
    // Edit sessions attach a recipe-scoped thread; coach uses the active page.
    const scope: PageScope = forRecipeId ? "recipe" : pageContext.scope;
    const contextId = forRecipeId || pageContext.contextId;
    const thread = await api.createSodieThread(scope, isPrivate, contextId);
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

  async function handleEditFollowUp(userText: string, recipeId?: string) {
    const targetRecipeId = recipeId || editingRecipeId;
    if (!targetRecipeId) return false;
    const id = await ensureThread(targetRecipeId);
    const replacedId = pendingProposal?.proposal.id;
    const response = await api.proposeRecipeEditFromRequest({
      source_recipe_id: targetRecipeId,
      thread_id: id,
      idempotency_key: `edit-${targetRecipeId}-${Date.now()}`,
      request: userText,
      pending_proposal_id: replacedId,
    });

    if (response.kind === "coach_qa") {
      return false;
    }

    // Stay in edit mode for follow-ups after an edit-class reply.
    setEditRecipeId(targetRecipeId);

    if (
      response.kind === "clarify" ||
      response.kind === "needs_more_info" ||
      response.kind === "suggest_swap" ||
      response.kind === "out_of_scope"
    ) {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content:
            response.assistant_message ||
            (response.kind === "suggest_swap"
              ? "Use Swap on the plan or recipe card for a different dish."
              : response.kind === "out_of_scope"
                ? "That sits outside a recipe edit — try Weekly Plan, Shopping, or Settings."
                : "Tell me the change you want and I’ll draft a proposal."),
        },
      ]);
      return true;
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
      return true;
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
    return true;
  }

  async function handlePreferenceFollowUp(userText: string) {
    const id = await ensureThread();
    const replacedId =
      pendingProposal?.proposal.action_type === "propose_preference_tweak"
        ? pendingProposal.proposal.id
        : undefined;
    const response = await api.proposePreferenceFromRequest({
      thread_id: id,
      idempotency_key: `pref-${Date.now()}`,
      request: userText,
      pending_proposal_id: replacedId,
    });

    if (response.kind === "coach_qa") {
      return false;
    }

    if (response.kind === "clarify" || response.kind === "needs_more_info") {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content:
            response.assistant_message ||
            "Which preference should we change — prep time, cook time, portions, or repeat cooldown?",
        },
      ]);
      return true;
    }

    if (!response.proposal) {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content: "I couldn’t draft that preference change. Try naming a specific setting.",
        },
      ]);
      return true;
    }

    const proposal = response.proposal;
    const assistantMessage =
      response.assistant_message || "Here’s a preference tweak for your review.";
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
    return true;
  }

  async function handleRecipePickFollowUp(userText: string) {
    const id = await ensureThread();
    const replacedId =
      pendingProposal?.proposal.action_type === "propose_recipe_pick"
        ? pendingProposal.proposal.id
        : undefined;
    const response = await api.proposeRecipePickFromRequest({
      thread_id: id,
      idempotency_key: `pick-${Date.now()}`,
      request: userText,
      pending_proposal_id: replacedId,
    });

    if (response.kind === "coach_qa") {
      return false;
    }

    if (response.kind === "clarify" || response.kind === "needs_more_info") {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content:
            response.assistant_message ||
            "What kind of recipe should I suggest — cuisine, time, or difficulty?",
        },
      ]);
      return true;
    }

    if (!response.proposal) {
      setItems((old) => [
        ...old,
        {
          kind: "message",
          sender: "ai",
          content: "I couldn’t pick a catalog recipe just now. Try a cuisine or time limit.",
        },
      ]);
      return true;
    }

    const proposal = response.proposal;
    const assistantMessage =
      response.assistant_message || "Here’s a recipe suggestion for your review.";
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
    return true;
  }

  async function send() {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setSending(true);
    setError("");
    setInput("");
    // Show the user bubble immediately so send doesn't look stuck.
    setItems((old) => [
      ...old,
      { kind: "message", sender: "user", content: userText },
    ]);
    try {
      if (editingRecipeId) {
        const handled = await handleEditFollowUp(userText);
        if (handled) return;
      } else {
        // FAB on recipe pages: classify edit vs coach so "add more salt"
        // creates a real proposal without requiring Edit with Sodie first.
        // Kitchen Mode stays coach-only (no edit proposals mid-cook).
        const pageRecipeId =
          pageContext.scope === "recipe" && pageContext.contextId
            ? pageContext.contextId
            : undefined;
        if (pageRecipeId) {
          const handled = await handleEditFollowUp(userText, pageRecipeId);
          if (handled) return;
        }
        if (pageContext.scope === "analytics") {
          if (pendingProposal?.proposal.action_type === "propose_recipe_pick") {
            const handled = await handleRecipePickFollowUp(userText);
            if (handled) return;
          } else {
            const prefHandled = await handlePreferenceFollowUp(userText);
            if (prefHandled) return;
            const pickHandled = await handleRecipePickFollowUp(userText);
            if (pickHandled) return;
          }
        }
      }

      const id = await ensureThread();
      const response = await api.sendSodieMessage(id, userText, {
        kitchen_state:
          pageContext.scope === "kitchen" ? kitchenState : null,
      });
      setItems((old) => [
        ...old,
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
      // Edit with Sodie starts from the catalog recipe page only.
      if (pageContext.scope !== "recipe") return;
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
    function onKitchenState(event: Event) {
      const detail = (event as CustomEvent<SodieKitchenState | null>).detail;
      setKitchenState(detail ?? null);
    }
    window.addEventListener(SODIE_KITCHEN_STATE_EVENT, onKitchenState);
    return () => {
      window.removeEventListener(SODIE_START_RECIPE_EDIT_EVENT, onStartRecipeEdit);
      window.removeEventListener(SODIE_OPEN_EVENT, onOpen);
      window.removeEventListener(SODIE_KITCHEN_STATE_EVENT, onKitchenState);
    };
  }, [pageContext.scope]);

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
      if (next.action_type === "propose_preference_tweak") {
        if (user?.id) {
          try {
            setUser(await api.getUser(user.id));
          } catch {
            /* profile refresh is best-effort; proposal already applied */
          }
        }
        setItems((old) => [
          ...old,
          {
            kind: "message",
            sender: "ai",
            content:
              "Preferences updated. Review them anytime under Settings → Preferences.",
          },
        ]);
        return;
      }
      if (next.action_type === "propose_recipe_pick") {
        if (next.source_recipe_id) {
          router.push(`/recipe/${next.source_recipe_id}`);
        }
        setItems((old) => [
          ...old,
          {
            kind: "message",
            sender: "ai",
            content: next.source_recipe_id
              ? "Opened that recipe. Your weekly plan is unchanged for now."
              : "Suggestion saved.",
          },
        ]);
        return;
      }
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
            "mb-3 flex h-[min(36rem,calc(100dvh-7.5rem))] w-[min(28rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xl",
            "sm:w-[min(32rem,calc(100vw-2.5rem))]"
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <SodieAvatar size="sm" animate="none" />
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">Ask Sodie</p>
                <p className="truncate text-xs text-stone-500">
                  {view === "history"
                    ? "Saved chats (private sessions stay out)"
                    : editingRecipeId
                      ? "Editing this recipe — personal copy on approve"
                      : SCOPE_LABEL[pageContext.scope]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {view === "chat" && !isPrivate && !editingRecipeId && (
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
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900">Private session</p>
                <p className="text-xs leading-snug text-stone-600">
                  {forcePrivate
                    ? "Settings chats stay private and never use cooking memory"
                    : "Not shown in history or used for memory"}
                </p>
              </div>
              <Switch
                checked={isPrivate}
                disabled={!!threadId || forcePrivate}
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
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}
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
                    className="flex items-stretch overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50/80 transition-colors hover:border-stone-300 hover:bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => void selectHistoryThread(thread.id)}
                      className="min-w-0 flex-1 px-3 py-3 text-left"
                    >
                      <p className="text-xs font-medium text-[hsl(var(--paprika))]">
                        {threadHistoryLabel(
                          thread.scope,
                          thread.context_id,
                          historyLabels
                        )}
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
                      onClick={(event) => {
                        event.stopPropagation();
                        setError("");
                        setPendingDelete(thread);
                      }}
                      className="shrink-0 border-l border-stone-200/80 px-3 text-stone-400 transition-colors hover:text-red-600"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
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
                    {editingRecipeId
                      ? "Tell me what to change — I’ll draft a before/after proposal you can approve or reject."
                        : pageContext.scope === "settings"
                        ? "Ask about Preferences or Account settings. These chats stay private and don’t use your cooking plan."
                        : pageContext.scope === "analytics"
                          ? "Ask about progress, request a preference tweak, or ask for a catalog recipe suggestion to approve."
                        : pageContext.scope === "personal_recipe"
                          ? "Ask about this personal recipe — ingredients, technique, or how it differs from the catalog version."
                          : pageContext.scope === "kitchen"
                            ? "Ask about the step you're on — timing, technique, or what to prep next. Recipe edits stay on the recipe page via Edit with Sodie."
                          : pageContext.scope === "recipe"
                            ? "Ask about timing or technique — or tell me what to change and I’ll draft a before/after proposal you can approve."
                            : "Ask about prep, timing, or techniques — or open a recipe and ask Sodie to change ingredients."}
                  </p>
                )}
                {items.map((item, index) =>
                  item.kind === "message" ? (
                    <div
                      key={`m-${index}`}
                      className={cn(
                        "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        item.sender === "ai"
                          ? "bg-amber-50 text-stone-800"
                          : "ml-auto bg-[hsl(var(--paprika))] text-white"
                      )}
                    >
                      {item.sender === "ai" ? (
                        <SodieMarkdown text={item.content} />
                      ) : (
                        item.content
                      )}
                    </div>
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
                {sending && (
                  <p className="max-w-[95%] rounded-2xl bg-amber-50/80 px-4 py-3 text-sm text-stone-500">
                    Sodie is thinking…
                  </p>
                )}
              </div>

              <div className="shrink-0 border-t border-stone-100 bg-stone-50/80 px-4 py-3 sm:px-5 sm:py-4">
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
                    editingRecipeId
                      ? "e.g. Scale for 2 more people, or make steps clearer"
                      : pageContext.scope === "settings"
                        ? "e.g. Where do I change dietary preferences?"
                        : pageContext.scope === "analytics"
                          ? "e.g. Am I leveling up, or stuck on hard recipes?"
                        : pageContext.scope === "personal_recipe"
                          ? "e.g. How do I cook this version tonight?"
                          : pageContext.scope === "recipe" ||
                              pageContext.scope === "kitchen"
                            ? "e.g. How long does this take? What’s tricky?"
                            : "Ask about what you’re cooking…"
                  }
                />
                {error && (
                  <div
                    role="alert"
                    className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    {error}
                  </div>
                )}
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

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) {
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="z-[60] border-2 border-[hsl(var(--paprika))]/40 bg-white sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--paprika))]">
              Delete this chat?
            </DialogTitle>
            <DialogDescription className="mt-2 text-stone-600">
              {pendingDelete
                ? `“${threadPreview(pendingDelete)}” will be removed from history. This can’t be undone.`
                : "This chat will be removed from history. This can’t be undone."}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div
              role="alert"
              className="rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-[100px] border-[hsl(var(--paprika))]/30 sm:w-auto"
              disabled={deleteBusy}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full min-w-[120px] bg-[hsl(var(--paprika))] text-white hover:bg-[hsl(var(--paprika))]/90 sm:w-auto"
              disabled={deleteBusy}
              onClick={() => void confirmDeleteHistoryThread()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
