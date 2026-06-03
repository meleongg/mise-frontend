"use client";

import SodieAvatar from "@/components/SodieAvatar";

type SodieAiLoadingProps = {
  message: string;
  submessage?: string;
  /** Full-screen overlay (plan generation, onboarding). */
  overlay?: boolean;
};

export default function SodieAiLoading({
  message,
  submessage,
  overlay = false,
}: SodieAiLoadingProps) {
  const content = (
    <div className="text-center space-y-4 px-6">
      <SodieAvatar
        size="2xl"
        animate="thinking"
        className="mx-auto drop-shadow-lg"
      />
      <p className="font-heading text-lg font-semibold text-[#262218]">
        {message}
      </p>
      {submessage ? (
        <p className="text-sm text-muted-foreground font-body">{submessage}</p>
      ) : null}
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--paprika))] mx-auto"
        aria-hidden
      />
    </div>
  );

  if (!overlay) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-500"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {content}
    </div>
  );
}
