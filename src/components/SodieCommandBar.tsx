"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { SodieChatInput, SodieChatThread } from "@/components/SodieChatParts";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import {
  SODIE_AI_DISCLAIMER,
  SODIE_PROMPT_SUGGESTIONS,
  useAdaptiveChat,
} from "@/hooks/useAdaptiveChat";
import { useEffect, useRef } from "react";

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
  const hasScrolledPanelIntoView = useRef(false);

  useEffect(() => {
    if (!chat.isActive || hasScrolledPanelIntoView.current) return;
    hasScrolledPanelIntoView.current = true;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.isActive]);

  const inputDisabled = !hasActivePlan || chat.isLoading || chat.isRateLimited;

  const inputBlock = (
    <div className="flex-1 w-full min-w-0">
      {!chat.isActive && (
        <p className="font-heading font-bold text-lg text-[#262218] mb-2 text-center sm:text-left">
          Ask Sodie
        </p>
      )}
      {!hasActivePlan && !chat.isActive && (
        <p className="text-sm text-[#262218]/80 font-body mb-3 text-center sm:text-left">
          Generate your weekly plan first to get personalized tips from Sodie.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1 min-w-0">
          <SodieChatInput
            value={chat.inputMessage}
            onChange={chat.setInputMessage}
            onSend={() => void chat.handleSendMessage()}
            onKeyDown={chat.handleKeyPress}
            onFocus={() => {
              if (hasActivePlan) chat.setIsExpanded(true);
            }}
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
          className="h-11 sm:h-12 px-5 sm:px-6 shrink-0 w-full sm:w-auto font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-md"
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
        <div className="flex flex-wrap gap-2 mt-3">
          {SODIE_PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => chat.setInputMessage(suggestion)}
              className="font-body text-xs sm:text-sm px-3 py-1.5 rounded-full border border-[hsl(var(--paprika))]/25 bg-[hsl(var(--paprika))]/5 text-[#262218] hover:bg-[hsl(var(--paprika))]/10 transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <SodieDisclaimer />
      </div>
    </div>
  );

  return (
    <section
      ref={panelRef}
      className={`sticky top-14 z-30 mx-auto w-full max-w-3xl mb-6 rounded-2xl border-2 bg-white/95 backdrop-blur-md shadow-cozy transition-all duration-300 ${
        chat.highlightBar
          ? "border-[hsl(var(--turmeric))] ring-2 ring-[hsl(var(--turmeric))]/40"
          : "border-[hsl(var(--paprika))]/30"
      } ${chat.isActive ? "flex flex-col max-h-[min(70vh,32rem)]" : "p-5 sm:p-6"}`}
    >
      {chat.isActive ? (
        <>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--paprika))]/10 shrink-0">
            <SodieAvatar size="md" animate="idle" />
            <p className="font-heading font-bold text-base text-[#262218]">
              Sodie
            </p>
          </div>

          <div
            ref={chat.threadScrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 py-3"
          >
            <SodieChatThread
              messages={chat.messages}
              isLoading={chat.isLoading}
              error={chat.error}
              embedded
            />
          </div>

          <div className="shrink-0 border-t border-[hsl(var(--paprika))]/10 px-4 py-3 bg-white/95 rounded-b-2xl">
            {inputBlock}
          </div>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          <SodieAvatar
            size="2xl"
            animate="idle"
            className="hidden sm:block shrink-0"
          />
          <SodieAvatar
            size="xl"
            animate="idle"
            className="sm:hidden shrink-0"
          />
          {inputBlock}
        </div>
      )}
    </section>
  );
}
