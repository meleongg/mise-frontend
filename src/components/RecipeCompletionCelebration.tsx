"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { useEffect, useState, type CSSProperties } from "react";

const CONFETTI_PIECES = [
  { left: "6%", delay: 0, drift: "-24px", color: "hsl(var(--paprika))" },
  { left: "14%", delay: 80, drift: "18px", color: "hsl(var(--turmeric))" },
  { left: "22%", delay: 40, drift: "-12px", color: "hsl(var(--sage))" },
  { left: "30%", delay: 120, drift: "28px", color: "#e07a4a" },
  { left: "38%", delay: 20, drift: "-32px", color: "hsl(var(--paprika))" },
  { left: "46%", delay: 160, drift: "14px", color: "hsl(var(--turmeric))" },
  { left: "54%", delay: 60, drift: "-20px", color: "hsl(var(--sage))" },
  { left: "62%", delay: 200, drift: "22px", color: "#6b8f71" },
  { left: "70%", delay: 100, drift: "-16px", color: "hsl(var(--paprika))" },
  { left: "78%", delay: 0, drift: "30px", color: "hsl(var(--turmeric))" },
  { left: "86%", delay: 140, drift: "-28px", color: "#e07a4a" },
  { left: "94%", delay: 50, drift: "10px", color: "hsl(var(--sage))" },
] as const;

type RecipeCompletionCelebrationProps = {
  message: string;
  submessage?: string;
};

export default function RecipeCompletionCelebration({
  message,
  submessage,
}: RecipeCompletionCelebrationProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center py-10 gap-4 overflow-hidden min-h-[220px]"
      role="status"
      aria-live="polite"
    >
      {!reducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          {CONFETTI_PIECES.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={
                {
                  left: piece.left,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}ms`,
                  "--confetti-drift": piece.drift,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <SodieAvatar size="xl" animate="celebrate" className="drop-shadow-md" />
        <p className="text-green-700 font-heading font-semibold text-lg text-center max-w-sm">
          {message}
        </p>
        {submessage ? (
          <p className="text-muted-foreground font-body text-sm text-center max-w-sm">
            {submessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
