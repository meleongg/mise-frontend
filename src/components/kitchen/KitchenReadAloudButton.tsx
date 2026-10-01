"use client";

import { Button } from "@/components/ui/button";
import { Volume2, Square } from "lucide-react";

type KitchenReadAloudButtonProps = {
  supported: boolean;
  speaking: boolean;
  stepText: string;
  onToggle: (text: string) => void;
};

/**
 * Play / stop current kitchen step via on-device speechSynthesis.
 */
export default function KitchenReadAloudButton({
  supported,
  speaking,
  stepText,
  onToggle,
}: KitchenReadAloudButtonProps) {
  if (!supported) {
    return (
      <p className="mt-3 text-[11px] text-stone-500">
        Read-aloud isn’t available in this browser.
      </p>
    );
  }

  const disabled = !stepText.trim();

  return (
    <div className="mt-3 flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onToggle(stepText)}
        className="border-[hsl(var(--sage))]/40 text-stone-800 hover:bg-[hsl(var(--sage))]/10"
        aria-pressed={speaking}
      >
        {speaking ? (
          <>
            <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Volume2 className="mr-1.5 h-3.5 w-3.5" />
            Read step
          </>
        )}
      </Button>
      <p className="text-[11px] text-stone-500">
        Plays on this device — works while Kitchen Mode is open.
      </p>
    </div>
  );
}
