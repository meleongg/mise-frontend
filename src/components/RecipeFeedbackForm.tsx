"use client";

import SodieAvatar from "@/components/SodieAvatar";
import BackNavButton from "@/components/BackNavButton";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks";
import { useSubmitFeedbackMutation } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export interface RecipeFeedbackExisting {
  feedback: string;
  notes?: string;
}

interface RecipeFeedbackFormProps {
  recipeId: string;
  weekNumber: number;
  existingFeedback?: RecipeFeedbackExisting;
  onFeedbackSubmitted?: () => void;
  onSkip?: () => void | Promise<void>;
  onBack?: () => void;
  variant?: "dialog" | "inline";
  className?: string;
}

export default function RecipeFeedbackForm({
  recipeId,
  weekNumber,
  existingFeedback,
  onFeedbackSubmitted,
  onSkip,
  onBack,
  variant = "dialog",
  className,
}: RecipeFeedbackFormProps) {
  const { user } = useUser();
  const submitFeedbackMutation = useSubmitFeedbackMutation();
  const [feedback, setFeedback] = useState(existingFeedback?.feedback || "");
  const [feedbackSelectError, setFeedbackSelectError] = useState<string | null>(
    null
  );
  const [notes, setNotes] = useState(existingFeedback?.notes || "");
  const [success, setSuccess] = useState(false);
  const [skipPending, setSkipPending] = useState(false);

  const isSubmitting = submitFeedbackMutation.isPending;
  const feedbackError = submitFeedbackMutation.error?.message || null;
  const isInline = variant === "inline";
  const hasExisting = Boolean(existingFeedback?.feedback);

  useEffect(() => {
    if (existingFeedback) {
      setFeedback(existingFeedback.feedback || "");
      setNotes(existingFeedback.notes || "");
    }
  }, [existingFeedback]);

  useEffect(() => {
    if (success && !isInline) {
      const timer = setTimeout(() => {
        const closeBtn = document.querySelector('[data-slot="dialog-close"]');
        if (closeBtn) (closeBtn as HTMLElement).click();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, isInline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setFeedbackSelectError(null);
    if (!user) return;
    if (!feedback) {
      setFeedbackSelectError(
        "Please select a feedback option before submitting."
      );
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        user_id: user.id,
        recipe_id: recipeId,
        week_number: weekNumber,
        feedback,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      onFeedbackSubmitted?.();
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;
    setSkipPending(true);
    try {
      await onSkip();
    } finally {
      setSkipPending(false);
    }
  };

  const title = hasExisting ? "Update how it went" : "How did it go?";
  const description = hasExisting
    ? "Update your feedback anytime — it helps me tune your next plan."
    : "No rush — a quick note helps me learn what works for you. You can always update this later from the recipe page.";

  const header = (
    <div className="flex items-start gap-4">
      <SodieAvatar
        size={isInline ? "lg" : "md"}
        animate="idle"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        {isInline ? (
          <>
            <h2 className="text-2xl font-bold text-primary">{title}</h2>
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          </>
        ) : (
          <>
            <DialogTitle className="mb-1 pr-8">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </>
        )}
      </div>
      {!isInline && <DialogClose className="absolute top-6 right-6" />}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-6 relative",
        isInline
          ? "bg-white/95 rounded-xl p-6 border-2 border-[hsl(var(--paprika))]/30"
          : "bg-white rounded-lg shadow p-8",
        className
      )}
    >
      {header}

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <SodieAvatar size="md" animate="celebrate" />
          <div className="text-green-600 font-medium text-lg text-center">
            {hasExisting
              ? "Feedback updated — thanks for sharing!"
              : "Thank you! I'll keep this in mind for your next week."}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={cn("space-y-4", isInline && "relative z-10")}
        >
          <Label htmlFor="feedback-select">
            How was this recipe? <span className="text-red-500">*</span>
          </Label>
          <Select
            value={feedback}
            onValueChange={(val) => {
              setFeedback(val);
              setFeedbackSelectError(null);
            }}
            required
          >
            <SelectTrigger
              id="feedback-select"
              className={cn(
                "h-12 text-base w-full",
                feedbackSelectError &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              aria-invalid={!!feedbackSelectError}
            >
              <SelectValue placeholder="Select feedback" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              sideOffset={4}
              collisionPadding={8}
              className={cn(
                "z-[200] bg-white border border-border shadow-lg",
                isInline && "w-[var(--radix-select-trigger-width)]"
              )}
            >
              <SelectItem value="too_easy">Too Easy</SelectItem>
              <SelectItem value="just_right">Just Right</SelectItem>
              <SelectItem value="too_hard">Too Hard</SelectItem>
            </SelectContent>
          </Select>
          {feedbackSelectError && (
            <div className="text-xs text-red-600 mt-1">
              {feedbackSelectError}
            </div>
          )}
          <Label htmlFor="notes-textarea">Additional Notes (optional)</Label>
          <Textarea
            id="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Share any thoughts or suggestions..."
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
          >
            {isSubmitting ? "Submitting..." : "Share feedback"}
          </Button>
          {isInline && onSkip && (
            <Button
              type="button"
              variant="outline"
              disabled={skipPending || isSubmitting}
              className="w-full h-12 text-base"
              onClick={handleSkip}
            >
              {skipPending ? "Saving..." : "Skip for now"}
            </Button>
          )}
          {isInline && onBack && (
            <BackNavButton
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onBack}
            >
              Back to recipe
            </BackNavButton>
          )}
          {feedbackError && (
            <div className="text-red-600 font-medium">{feedbackError}</div>
          )}
        </form>
      )}
    </div>
  );
}
