"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { SodieChatInput, SodieChatThread } from "@/components/SodieChatParts";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import {
  SODIE_AI_DISCLAIMER,
  SODIE_PROMPT_SUGGESTIONS,
  useAdaptiveChat,
} from "@/hooks/useAdaptiveChat";
import { useEffect, useRef, useState } from "react";

type SodieCommandBarProps = {
  hasActivePlan: boolean;
};

function SodieDisclaimer() {
  return (
    <p className="text-xs text-muted-foreground font-body leading-snug">
      {SODIE_AI_DISCLAIMER}
    </p>
  );
}

export default function SodieCommandBar({
  hasActivePlan,
}: SodieCommandBarProps) {
  const chat = useAdaptiveChat({ hasActivePlan });
  const panelRef = useRef<HTMLElement>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    const count = chat.messages.length;
    if (prevMessageCount.current === 0 && count > 0) {
      setIsChatCollapsed(false);
    }
    prevMessageCount.current = count;
  }, [chat.messages.length]);

  const inputDisabled = !hasActivePlan || chat.isLoading || chat.isRateLimited;
  const showCompactChat = chat.isActive && isChatCollapsed;

  const askSodieHeader = (avatarSize: "lg" | "md", subtitle?: string) => (
    <div className="flex items-center gap-3 min-w-0">
      <SodieAvatar size={avatarSize} animate="none" className="shrink-0" />
      <div className="min-w-0 text-left">
        <p className="font-heading font-bold text-lg text-[#262218] leading-tight">
          Ask Sodie
        </p>
        {subtitle ? (
          <p className="text-sm text-muted-foreground font-body mt-0.5 truncate">
            {subtitle}
          </p>
        ) : !hasActivePlan ? (
          <p className="text-sm text-[#262218]/80 font-body mt-0.5">
            Generate your weekly plan first for personalized tips.
          </p>
        ) : null}
      </div>
    </div>
  );

  const compactChatSummary = () => {
    const n = chat.messages.length;
    if (chat.isLoading) return "Sodie is thinking…";
    if (n === 1) return "1 message — tap to continue";
    return `${n} messages — tap to continue`;
  };

  const collapsedHeader = !chat.isActive && (
    <div className="mb-4">{askSodieHeader("lg")}</div>
  );

  const inputBlock = (
    <div className="flex-1 w-full min-w-0">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1 min-w-0">
          <SodieChatInput
            value={chat.inputMessage}
            onChange={chat.setInputMessage}
            onSend={() => void chat.handleSendMessage()}
            onKeyDown={chat.handleKeyPress}
            placeholder={chat.placeholder}
            isLoading={chat.isLoading}
            isRateLimited={chat.isRateLimited}
            disabled={inputDisabled}
            rows={chat.isActive ? 2 : 2}
            showSendButton={false}
          />
        </div>
        <Button
          type="button"
          onClick={() => void chat.handleSendMessage()}
          disabled={!chat.canSend}
          size="touch"
          className="px-5 sm:px-6 shrink-0 w-full sm:w-auto font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-md"
        >
          {chat.isLoading ? (
            "Sending..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" aria-hidden />
              Send
            </span>
          )}
        </Button>
      </div>
      {hasActivePlan && !chat.isActive && (
        <div
          className="flex flex-wrap gap-2 mt-3"
          role="group"
          aria-label="Suggested questions"
        >
          {SODIE_PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => chat.setInputMessage(suggestion)}
              className="font-body text-xs sm:text-sm px-3 py-1.5 rounded-full border border-[hsl(var(--paprika))]/25 bg-[hsl(var(--paprika))]/5 text-[#262218] hover:bg-[hsl(var(--paprika))]/10 transition-colors text-left max-w-full"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      {!chat.isActive && (
        <div className="mt-4 pt-3 border-t border-[hsl(var(--paprika))]/10">
          <SodieDisclaimer />
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={panelRef}
      className={`sticky top-14 z-30 mx-auto w-full max-w-3xl mb-6 rounded-2xl border-2 bg-white/95 backdrop-blur-md shadow-cozy transition-all duration-300 ${
        chat.highlightBar
          ? "border-[hsl(var(--turmeric))] ring-2 ring-[hsl(var(--turmeric))]/40"
          : "border-[hsl(var(--paprika))]/30"
      } ${showCompactChat ? "p-4" : chat.isActive ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}
    >
      {showCompactChat ? (
        <button
          type="button"
          onClick={() => setIsChatCollapsed(false)}
          className="flex w-full items-center gap-3 text-left rounded-lg hover:bg-[hsl(var(--paprika))]/5 transition-colors -m-1 p-1"
          aria-expanded={false}
          aria-controls="sodie-chat-panel"
        >
          {askSodieHeader("lg", compactChatSummary())}
          <ChevronDown
            className="w-5 h-5 shrink-0 text-muted-foreground ml-auto"
            aria-hidden
          />
        </button>
      ) : chat.isActive ? (
        <>
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[hsl(var(--paprika))]/10">
            {askSodieHeader("md")}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsChatCollapsed(true)}
              className="shrink-0 text-muted-foreground hover:text-[#262218] gap-1 font-body"
              aria-expanded
              aria-controls="sodie-chat-panel"
              aria-label="Minimize Sodie chat"
            >
              <ChevronUp className="w-4 h-4" aria-hidden />
              <span className="hidden sm:inline">Minimize</span>
            </Button>
          </div>

          <div
            id="sodie-chat-panel"
            ref={chat.threadScrollRef}
            className="overflow-y-auto max-h-[min(50vh,16rem)] px-0.5 py-1 mb-3"
          >
            <SodieChatThread
              messages={chat.messages}
              isLoading={chat.isLoading}
              error={chat.error}
              embedded
            />
          </div>

          <div className="border-t border-[hsl(var(--paprika))]/10 pt-3 space-y-3">
            {inputBlock}
            <SodieDisclaimer />
          </div>
        </>
      ) : (
        <div className="w-full min-w-0">
          {collapsedHeader}
          {inputBlock}
        </div>
      )}
    </section>
  );
}
