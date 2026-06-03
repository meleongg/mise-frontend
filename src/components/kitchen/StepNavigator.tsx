"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { InstructionStep } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepNavigatorProps {
  steps: InstructionStep[];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export default function StepNavigator({
  steps,
  currentIndex,
  onPrevious,
  onNext,
  onFinish,
}: StepNavigatorProps) {
  const step = steps[currentIndex];
  const total = steps.length;
  const isLast = currentIndex === total - 1;

  if (!step || total === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No instructions available for this recipe.
      </p>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex
                ? "w-6 bg-[hsl(var(--paprika))]"
                : i < currentIndex
                  ? "w-2 bg-[hsl(var(--paprika))]/50"
                  : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      <p className="text-sm font-medium text-[hsl(var(--paprika))] mb-2">
        Step {step.step} of {total}
      </p>
      <p className="text-xl md:text-2xl leading-relaxed text-primary font-medium flex-1">
        {step.text}
      </p>

      {isLast && (
        <div className="flex items-center gap-3 mt-6 p-3 rounded-lg bg-white/80 border border-[hsl(var(--paprika))]/20">
          <SodieAvatar size="sm" animate="idle" className="shrink-0" />
          <p className="text-sm text-muted-foreground">
            Smells good? Wrap up when you&apos;re ready — I&apos;d love to hear
            how it went.
          </p>
        </div>
      )}

      <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-amber-50 via-amber-50 to-transparent mt-8 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex-1 h-14 text-base border-2"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        {isLast ? (
          <Button
            type="button"
            onClick={onFinish}
            className="flex-1 h-14 text-base font-semibold bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
          >
            Finish cooking
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            className="flex-1 h-14 text-base font-semibold bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
