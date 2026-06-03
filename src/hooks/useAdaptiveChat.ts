"use client";

import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import { api, ApiError } from "@/lib/api";
import { ChatMessage } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export const SODIE_AI_DISCLAIMER =
  "Sodie uses AI and can make mistakes. Double-check recipes, allergens, and instructions before you cook.";

export const SODIE_PROMPT_SUGGESTIONS = [
  "What should I cook first this week?",
  "Any prep I can do ahead for my plan?",
  "How am I doing this week?",
] as const;

function getRetryAfterSeconds(err: ApiError) {
  const retryAfterHeader = err?.response?.headers?.get?.("Retry-After");
  if (!retryAfterHeader) return null;
  const parsedSeconds = Number(retryAfterHeader);
  if (Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
    return parsedSeconds;
  }
  return null;
}

type UseAdaptiveChatOptions = {
  hasActivePlan: boolean;
};

export function useAdaptiveChat({ hasActivePlan }: UseAdaptiveChatOptions) {
  const { user } = useUser();
  const { state } = useApp();
  const currentWeek = state.currentWeek;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightBar, setHighlightBar] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const rateLimitTimeoutRef = useRef<number | null>(null);

  const isRateLimited = rateLimitUntil !== null && rateLimitUntil > Date.now();
  /** True only after the user has sent at least one message (avoids focus layout jump). */
  const isActive = messages.length > 0;
  const canSend =
    hasActivePlan &&
    !isLoading &&
    !isRateLimited &&
    Boolean(inputMessage.trim());

  const scrollThreadToBottom = useCallback((force = false) => {
    const el = threadScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 48;
    if (force || isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const userJustSent = last?.sender === "user";
    scrollThreadToBottom(userJustSent || isLoading);
  }, [messages, isLoading, scrollThreadToBottom]);

  useEffect(() => {
    return () => {
      if (rateLimitTimeoutRef.current !== null) {
        window.clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  }, []);

  const startRateLimitCooldown = useCallback((retryAfterSeconds: number) => {
    const cooldownMs = Math.max(retryAfterSeconds, 1) * 1000;
    const expiresAt = Date.now() + cooldownMs;
    setRateLimitUntil(expiresAt);
    setError("");
    if (rateLimitTimeoutRef.current !== null) {
      window.clearTimeout(rateLimitTimeoutRef.current);
    }
    rateLimitTimeoutRef.current = window.setTimeout(() => {
      setRateLimitUntil(null);
      rateLimitTimeoutRef.current = null;
    }, cooldownMs);
  }, []);

  useEffect(() => {
    const handleFirstPlan = () => {
      setHighlightBar(true);
      window.setTimeout(() => setHighlightBar(false), 4000);
    };
    window.addEventListener("firstPlanGenerated", handleFirstPlan);
    return () =>
      window.removeEventListener("firstPlanGenerated", handleFirstPlan);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !user || isRateLimited || !hasActivePlan)
      return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: inputMessage.trim(),
      timestamp: new Date(),
      type: "general",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError("");
    try {
      const response = await api.adaptiveChat(user.id, {
        user_message: userMessage.text,
        week_number: currentWeek > 0 ? currentWeek : undefined,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? {
                ...msg,
                type: response.intent === "analytics" ? "analytics" : "general",
              }
            : msg
        )
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.response,
        timestamp: new Date(),
        type: response.intent === "analytics" ? "analytics" : "general",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const apiError = err instanceof ApiError ? err : null;
      const status = apiError?.status;

      if (status === 429) {
        const retryAfterSeconds = apiError
          ? getRetryAfterSeconds(apiError)
          : null;
        startRateLimitCooldown(retryAfterSeconds ?? 10);
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender: "ai",
            text: "You're sending messages too quickly. Please wait and try again.",
            timestamp: new Date(),
            type: "general",
          },
        ]);
        return;
      }

      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to get response. Please try again.";
      setError(errorMsg);
      setInputMessage(userMessage.text);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [
    inputMessage,
    user,
    isRateLimited,
    hasActivePlan,
    currentWeek,
    startRateLimitCooldown,
  ]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const placeholder = !hasActivePlan
    ? "Generate your weekly plan below to get personalized tips from Sodie."
    : user?.first_name
      ? `Hey ${user.first_name}! Ask about this week's meals, prep tips, or your progress…`
      : "Ask about this week's meals, prep tips, or your progress…";

  return {
    user,
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    error,
    highlightBar,
    isRateLimited,
    isActive,
    canSend,
    hasActivePlan,
    threadScrollRef,
    handleSendMessage,
    handleKeyPress,
    placeholder,
  };
}
