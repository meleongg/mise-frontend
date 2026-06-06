"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks";
import {
  formatRecipeDate,
  getSwapOutAvailabilityCopy,
} from "@/lib/weekContext";
import { useState } from "react";

interface SwapRecipeModalProps {
  isOpen: boolean;
  recipeName: string;
  recipeId: string;
  weekNumber: number;
  /** When this recipe was added to the user's week plan (plan created_at). */
  planAddedAt?: string | null;
  onClose: () => void;
  onConfirm: (context: string) => Promise<void>;
  isLoading?: boolean;
}

export default function SwapRecipeModal({
  isOpen,
  recipeName,
  weekNumber,
  planAddedAt,
  onClose,
  onConfirm,
  isLoading = false,
}: SwapRecipeModalProps) {
  const { user } = useUser();
  const [swapContext, setSwapContext] = useState("");
  const swapAvailabilityLine = getSwapOutAvailabilityCopy(
    user?.recipe_repeat_preference
  );

  const handleConfirm = async () => {
    if (swapContext.trim().length === 0) return;

    try {
      await onConfirm(swapContext);
      setSwapContext("");
    } catch {
      // Error is handled by parent component
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSwapContext("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-[hsl(var(--paprika))]/60">
        {isLoading ? (
          <div
            className="py-10 flex flex-col items-center gap-4 text-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <DialogTitle className="sr-only">Swap Recipe</DialogTitle>
            <SodieAvatar
              size="xl"
              animate="thinking"
              className="drop-shadow-md"
            />
            <p className="font-heading font-semibold text-[#262218]">
              Finding your replacement...
            </p>
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--paprika))]"
              aria-hidden
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-6">
                <SodieAvatar
                  size="lg"
                  animate="none"
                  className="shrink-0 drop-shadow-sm max-sm:hidden"
                />
                <SodieAvatar
                  size="md"
                  animate="none"
                  className="shrink-0 drop-shadow-sm sm:hidden"
                />
                <div className="space-y-1.5 text-left min-w-0">
                  <DialogTitle>Swap Recipe</DialogTitle>
                  <DialogDescription>
                    Tell Sodie what you&apos;d prefer — we&apos;ll find a
                    replacement that fits your plan and preferences.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-muted-foreground">Current Recipe</p>
                <p className="font-semibold text-[hsl(var(--paprika))]">
                  {recipeName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Week {weekNumber}
                  {planAddedAt
                    ? ` · On your plan since ${formatRecipeDate(planAddedAt)}`
                    : ""}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-800 leading-relaxed">
                  {swapAvailabilityLine}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="swap-context"
                  className="text-sm font-medium text-gray-700"
                >
                  Why do you want to swap this recipe?
                </label>
                <p className="text-xs text-muted-foreground">
                  Tell us what you&apos;d prefer instead. This helps our AI find
                  the perfect replacement.
                </p>
                <Textarea
                  id="swap-context"
                  value={swapContext}
                  onChange={(e) => setSwapContext(e.target.value)}
                  placeholder="E.g., 'I want something vegetarian', 'Need a faster recipe', 'Allergic to dairy', 'Want more protein'"
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {swapContext.length}/500
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[hsl(var(--paprika))]/5 rounded-lg border border-[hsl(var(--paprika))]/20">
                <SodieAvatar size="lg" animate="none" className="shrink-0" />
                <p className="text-sm leading-snug text-[#262218]/90 font-body min-w-0 flex-1">
                  <strong className="font-semibold">Pro tip:</strong> Be
                  specific about diet, time, or ingredients — Sodie uses this to
                  pick your best swap.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="touch"
            onClick={handleClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            size="touch"
            onClick={handleConfirm}
            disabled={swapContext.trim().length === 0 || isLoading}
            className="min-w-[120px] bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))]"
          >
            Swap Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
