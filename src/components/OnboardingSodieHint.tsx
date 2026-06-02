"use client";

import SodieAvatar from "@/components/SodieAvatar";

type OnboardingSodieHintProps = {
  children: React.ReactNode;
};

export default function OnboardingSodieHint({
  children,
}: OnboardingSodieHintProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-[hsl(var(--paprika))]/5 border border-[hsl(var(--paprika))]/15">
      <SodieAvatar
        size="md"
        animate="idle"
        className="shrink-0 drop-shadow-sm"
      />
      <p className="text-sm font-body text-[#262218]/90 leading-snug">
        {children}
      </p>
    </div>
  );
}
