"use client";

import { useUser } from "@/hooks";
import { api, ApiError } from "@/lib/api";
import { ChatMessage } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

function getRetryAfterSeconds(err: ApiError) {
  const retryAfterHeader = err?.response?.headers?.get?.("Retry-After");
  if (!retryAfterHeader) return null;
  const parsedSeconds = Number(retryAfterHeader);
  if (Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
    return parsedSeconds;
  }
  return null;
}

export function useAdaptiveChat() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightBar, setHighlightBar] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const rateLimitTimeoutRef = useRef<number | null>(null);

  const isRateLimited = rateLimitUntil !== null && rateLimitUntil > Date.now();
  const isActive = isExpanded || messages.length > 0;

  const scrollThreadToBottom = useCallback(() => {
    const el = threadScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollThreadToBottom();
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
    if (!inputMessage.trim() || !user || isRateLimited) return;

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
    setIsExpanded(true);

    try {
      const response = await api.adaptiveChat(user.id, {
        user_message: userMessage.text,
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
  }, [inputMessage, user, isRateLimited, startRateLimitCooldown]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const placeholder = user?.first_name
    ? `Hey ${user.first_name}! What are we cooking tonight? Paste a recipe link or ask Sodie to scale your meal plan...`
    : "What are we cooking tonight? Paste a recipe link or ask Sodie anything...";

  return {
    user,
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    error,
    isExpanded,
    setIsExpanded,
    highlightBar,
    isRateLimited,
    isActive,
    threadScrollRef,
    handleSendMessage,
    handleKeyPress,
    placeholder,
  };
}
