"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { SodieChatInput, SodieChatThread } from "@/components/SodieChatParts";
import { useAdaptiveChat } from "@/hooks/useAdaptiveChat";
import { useEffect, useRef } from "react";

export default function SodieCommandBar() {
  const chat = useAdaptiveChat();
  const panelRef = useRef<HTMLElement>(null);
  const hasScrolledPanelIntoView = useRef(false);

  // On first send, gently bring the panel into view without hijacking page scroll later
  useEffect(() => {
    if (!chat.isActive || hasScrolledPanelIntoView.current) return;
    hasScrolledPanelIntoView.current = true;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.isActive]);

  const inputBlock = (
    <div className="flex-1 w-full min-w-0">
      {!chat.isActive && (
        <p className="font-heading font-bold text-lg text-[#262218] mb-2 text-center sm:text-left">
          Ask Sodie
        </p>
      )}
      <SodieChatInput
        value={chat.inputMessage}
        onChange={chat.setInputMessage}
        onSend={() => void chat.handleSendMessage()}
        onKeyDown={chat.handleKeyPress}
        onFocus={() => chat.setIsExpanded(true)}
        placeholder={chat.placeholder}
        isLoading={chat.isLoading}
        isRateLimited={chat.isRateLimited}
        rows={chat.isActive ? 2 : 2}
        showSendButton={false}
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={() => void chat.handleSendMessage()}
          disabled={
            !chat.inputMessage.trim() || chat.isLoading || chat.isRateLimited
          }
          className="font-body text-sm font-semibold text-[hsl(var(--paprika))] hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {chat.isLoading ? "Sending..." : "Send →"}
        </button>
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
            <SodieAvatar size="sm" animate="idle" />
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
            size="xl"
            animate="idle"
            className="hidden sm:block shrink-0"
          />
          <SodieAvatar
            size="lg"
            animate="idle"
            className="sm:hidden shrink-0"
          />
          {inputBlock}
        </div>
      )}
    </section>
  );
}
