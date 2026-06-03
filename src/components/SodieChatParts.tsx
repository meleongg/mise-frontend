"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SODIE_CHAT_MAX_LENGTH } from "@/lib/aiLimits";
import { ChatMessage } from "@/types";

function renderMessageLine(line: string, idx: number) {
  const numberedMatch = line.match(/^(\d+)\.\s+\*\*(.*?)\*\*(.*)$/);
  if (numberedMatch) {
    return (
      <p key={idx} className="mb-2">
        <span className="font-semibold">
          {numberedMatch[1]}. {numberedMatch[2]}
        </span>
        {numberedMatch[3]}
      </p>
    );
  }

  const boldMatch = line.match(/\*\*(.*?)\*\*/g);
  if (boldMatch) {
    const parts = line.split(/(\*\*.*?\*\*)/);
    return (
      <p key={idx} className="mb-1">
        {parts.map((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span key={partIdx} className="font-semibold">
                {part.slice(2, -2)}
              </span>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}
      </p>
    );
  }

  return line.trim() ? (
    <p key={idx} className="mb-1">
      {line}
    </p>
  ) : (
    <br key={idx} />
  );
}

interface SodieChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string;
  /** When true, parent owns scrolling (no max-height here) */
  embedded?: boolean;
}

export function SodieChatThread({
  messages,
  isLoading,
  error,
  embedded = false,
}: SodieChatThreadProps) {
  if (messages.length === 0 && !isLoading && !error) return null;

  return (
    <div
      className={`space-y-3 ${embedded ? "" : "overflow-y-auto max-h-72 pr-1"}`}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex flex-col ${
            message.sender === "user" ? "items-end" : "items-start"
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground mb-1 px-1 font-body">
            {message.sender === "user" ? "You" : "Sodie"}
          </p>
          <div
            className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm font-body ${
              message.sender === "user"
                ? "bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-500 text-white shadow-md"
                : "bg-white text-foreground border border-[hsl(var(--paprika))]/20 shadow-sm"
            }`}
          >
            {message.text
              .split("\n")
              .map((line, idx) => renderMessageLine(line, idx))}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-3 py-2 font-body text-sm text-muted-foreground">
            Sodie is thinking<span className="animate-pulse">...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center">
          <div className="inline-block bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm font-body">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

interface SodieChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  placeholder: string;
  isLoading: boolean;
  isRateLimited: boolean;
  disabled?: boolean;
  rows?: number;
  showSendButton?: boolean;
}

export function SodieChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  onFocus,
  placeholder,
  isLoading,
  isRateLimited,
  disabled = false,
  rows = 2,
  showSendButton = true,
}: SodieChatInputProps) {
  const isDisabled = disabled || isLoading || isRateLimited;
  return (
    <div className="space-y-2 w-full">
      <Textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value.slice(0, SODIE_CHAT_MAX_LENGTH))
        }
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={rows}
        maxLength={SODIE_CHAT_MAX_LENGTH}
        className="resize-none font-body bg-white/90 border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
        disabled={isDisabled}
      />
      {isRateLimited && (
        <p className="text-xs text-muted-foreground font-body">
          Rate limited. Please try again shortly.
        </p>
      )}
      {showSendButton && (
        <Button
          onClick={onSend}
          disabled={!value.trim() || isDisabled}
          className="w-full sm:w-auto bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white font-semibold font-body"
        >
          {isLoading ? "Sending..." : "Ask Sodie"}
        </Button>
      )}
    </div>
  );
}
