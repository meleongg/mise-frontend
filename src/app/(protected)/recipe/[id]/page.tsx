"use client";

import RecipeFeedbackForm from "@/components/RecipeFeedbackForm";
import RecipeHeroImage from "@/components/RecipeHeroImage";
import RecipeInstructionList from "@/components/RecipeInstructionList";
import SodieAvatar from "@/components/SodieAvatar";
import BackNavButton from "@/components/BackNavButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import {
  useRecipeQuery,
  useToggleRecipeStatusMutation,
  useWeeklyRecipeProgressQuery,
} from "@/hooks/queries";
import { ApiError, parseHelpers } from "@/lib/api";
import { resolveRecipeWeek } from "@/lib/recipeWeek";
import { scrollToTop } from "@/lib/scroll";
import { CircleCheck, RotateCcw, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useLayoutEffect, useState } from "react";

const FEEDBACK_LABELS: Record<string, string> = {
  too_easy: "Too easy",
  just_right: "Just right",
  too_hard: "Too hard",
};

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const recipeId = resolvedParams.id;
  const { state } = useApp();

  useLayoutEffect(() => {
    scrollToTop();
  }, [recipeId]);
  const weekNumber = resolveRecipeWeek(searchParams, state.currentWeek);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [statusError, setStatusError] = useState("");
  const { user } = useUser();
  const router = useRouter();
  const toggleStatusMutation = useToggleRecipeStatusMutation();

  // Fetch recipe using TanStack Query (automatic caching)
  const { data: recipe, isLoading } = useRecipeQuery(recipeId);
  const { data: recipeProgress } = useWeeklyRecipeProgressQuery(
    user?.id,
    weekNumber
  );

  // Check if this specific recipe has feedback/progress
  const existingFeedback = recipeProgress?.find(
    (p) => p.recipe_id === resolvedParams.id
  );
  const isCompleted = existingFeedback?.status === "completed";
  const isInProgress = existingFeedback?.status === "in_progress";
  const hasRatingFeedback = Boolean(existingFeedback?.feedback);

  const feedbackData = existingFeedback?.feedback
    ? {
        feedback: existingFeedback.feedback,
        notes: existingFeedback.notes,
      }
    : undefined;

  const openFeedbackModal = () => setShowFeedbackModal(true);

  const handleCompleteWithoutFeedback = async () => {
    if (!user) return;
    await toggleStatusMutation.mutateAsync({
      userId: user.id,
      recipeId: resolvedParams.id,
      weekNumber,
      request: { status: "completed" },
    });
  };

  const handleMarkIncomplete = async () => {
    if (!user) return;
    setStatusError("");
    try {
      await toggleStatusMutation.mutateAsync({
        userId: user.id,
        recipeId: resolvedParams.id,
        weekNumber,
        request: { status: "not_started" },
      });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to mark recipe as incomplete. Please try again.";
      setStatusError(message);
    }
  };

  const feedbackLabel = existingFeedback?.feedback
    ? (FEEDBACK_LABELS[existingFeedback.feedback] ?? existingFeedback.feedback)
    : null;

  if (isLoading || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    );
  }

  const ingredients = parseHelpers.parseRecipeIngredients(recipe.ingredients);
  const instructions = parseHelpers.parseRecipeInstructions(
    recipe.instructions
  );
  const dietaryTags = recipe.dietary_tags
    ? parseHelpers.parseRecipeTags(recipe.dietary_tags)
    : [];
  const allergens = recipe.allergens
    ? parseHelpers.parseRecipeTags(recipe.allergens)
    : [];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-[hsl(var(--turmeric))]/30">
      <div className="max-w-4xl mx-auto">
        <BackNavButton
          onClick={() => router.push("/weekly-plan")}
          variant="secondary"
          className="mb-4 font-semibold text-white bg-[hsl(var(--paprika))] border-none hover:bg-[hsl(var(--primary))]/90 transition-colors duration-200"
        >
          Back to weekly plan
        </BackNavButton>

        <Card className="shadow-2xl border-2 border-[hsl(var(--paprika))]/60 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-heading font-bold text-2xl md:text-3xl text-[#262218] min-w-0">
                  {recipe.name}
                </CardTitle>
                {user && isCompleted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--sage))]/40 bg-[hsl(var(--sage))]/10 px-3 py-1 text-sm font-semibold text-[hsl(var(--sage))] shrink-0">
                    <CircleCheck className="h-4 w-4" aria-hidden />
                    Completed
                  </span>
                )}
                {user && isInProgress && !isCompleted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--paprika))]/30 bg-[hsl(var(--paprika))]/10 px-3 py-1 text-sm font-semibold text-[hsl(var(--paprika))] shrink-0">
                    In progress
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {recipe.image_url ? (
              <RecipeHeroImage
                src={recipe.image_url}
                alt={recipe.name}
                variant="detail"
              />
            ) : (
              <div className="w-full h-48 md:h-64 rounded-lg shadow-md bg-gradient-to-br from-amber-100 via-orange-50 to-[hsl(var(--turmeric))]/40 flex flex-col items-center justify-center gap-3 border border-[hsl(var(--paprika))]/20">
                <SodieAvatar size="xl" animate="none" />
                <p className="text-sm text-muted-foreground">
                  Photo coming soon — Sodie&apos;s got your steps covered.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold text-primary">Cuisine:</span>
                <p className="text-muted-foreground">{recipe.cuisine}</p>
              </div>
              <div>
                <span className="font-semibold text-primary">Difficulty:</span>
                <p className="text-muted-foreground capitalize">
                  {recipe.difficulty}
                </p>
              </div>
              {recipe.prep_time_minutes != null && (
                <div>
                  <span className="font-semibold text-primary">Prep Time:</span>
                  <p className="text-muted-foreground">
                    {recipe.prep_time_minutes} min
                  </p>
                </div>
              )}
              {recipe.cook_time_minutes != null && (
                <div>
                  <span className="font-semibold text-primary">Cook Time:</span>
                  <p className="text-muted-foreground">
                    {recipe.cook_time_minutes} min
                  </p>
                </div>
              )}
              {recipe.portion_size && (
                <div>
                  <span className="font-semibold text-primary">Serves:</span>
                  <p className="text-muted-foreground">{recipe.portion_size}</p>
                </div>
              )}
            </div>

            {user && isCompleted && (
              <div className="space-y-3 rounded-lg border-2 border-[hsl(var(--sage))]/35 bg-[hsl(var(--sage))]/5 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--sage))]/15">
                    <CircleCheck
                      className="h-6 w-6 text-[hsl(var(--sage))]"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-[#262218]">
                      You&apos;ve completed this recipe
                    </p>
                    {feedbackLabel ? (
                      <p className="text-sm text-muted-foreground mt-1 font-body">
                        Your rating:{" "}
                        <span className="font-medium text-[#262218]">
                          {feedbackLabel}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 font-body">
                        No difficulty rating yet — add feedback to help Sodie
                        tune your next plan.
                      </p>
                    )}
                    {existingFeedback?.notes?.trim() && (
                      <p className="text-sm text-muted-foreground mt-2 font-body italic border-l-2 border-[hsl(var(--sage))]/30 pl-3">
                        {existingFeedback.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    size="touch"
                    onClick={openFeedbackModal}
                    className="flex-1 font-semibold bg-[hsl(var(--sage))] hover:bg-[hsl(var(--sage))]/90 text-white"
                  >
                    {hasRatingFeedback ? "Update feedback" : "Add feedback"}
                  </Button>
                  <Button
                    type="button"
                    size="touch"
                    variant="outline"
                    onClick={() => void handleMarkIncomplete()}
                    disabled={toggleStatusMutation.isPending}
                    className="flex-1 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2 shrink-0" />
                    {toggleStatusMutation.isPending
                      ? "Updating..."
                      : "Mark as incomplete"}
                  </Button>
                </div>
                {statusError && (
                  <p className="text-sm text-red-600 font-body">
                    {statusError}
                  </p>
                )}
              </div>
            )}

            {user && !isCompleted && (
              <div className="space-y-4 rounded-xl border-2 border-[hsl(var(--paprika))]/20 bg-gradient-to-br from-amber-50/80 via-white to-white px-4 py-4 sm:px-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <SodieAvatar
                    size="lg"
                    animate="none"
                    className="shrink-0 drop-shadow-sm"
                  />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Ready when you are — kitchen mode walks you through each
                    step, or mark complete if you already made this dish.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="touchProminent"
                    className="flex-1 text-lg font-semibold bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-md ring-1 ring-[hsl(var(--paprika))]/25 border-0"
                  >
                    <Link
                      href={`/recipe/${recipe.id}/cook?week=${weekNumber}&commit=1`}
                      className="inline-flex w-full h-full min-h-full items-center justify-center gap-2"
                    >
                      <UtensilsCrossed className="w-5 h-5 shrink-0" />
                      {isInProgress
                        ? "Resume cooking with Sodie"
                        : "Start cooking with Sodie"}
                    </Link>
                  </Button>
                  {!isInProgress && (
                    <Button
                      asChild
                      variant="outline"
                      size="touchProminent"
                      className="flex-1 text-base font-semibold bg-white text-[hsl(var(--paprika))] border-2 border-[hsl(var(--paprika))] hover:bg-[hsl(var(--paprika))]/8 shadow-sm"
                    >
                      <Link
                        href={`/recipe/${recipe.id}/cook?week=${weekNumber}&preview=1`}
                        className="inline-flex w-full h-full min-h-full items-center justify-center"
                      >
                        Preview steps
                      </Link>
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
                  className="w-full h-auto py-5 sm:py-6 text-base font-semibold bg-white border-2 border-[hsl(var(--sage))] text-[hsl(var(--sage))] hover:bg-[hsl(var(--sage))]/10 shadow-sm"
                  onClick={openFeedbackModal}
                  disabled={toggleStatusMutation.isPending}
                >
                  <CircleCheck className="w-5 h-5 mr-2 shrink-0" />
                  Mark as complete
                </Button>
              </div>
            )}

            {(dietaryTags.length > 0 || allergens.length > 0) && (
              <div className="space-y-3">
                {dietaryTags.length > 0 && (
                  <div>
                    <span className="font-semibold text-primary text-sm">
                      Dietary:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dietaryTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {allergens.length > 0 && (
                  <div>
                    <span className="font-semibold text-primary text-sm">
                      Allergens:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allergens.map((allergen, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Ingredients
              </h3>
              <ul className="space-y-2">
                {ingredients.map((ingredient: string, idx) => {
                  const ingredientText = ingredient;
                  return (
                    <li
                      key={idx}
                      className="flex items-start text-muted-foreground"
                    >
                      <span className="text-[hsl(var(--paprika))] mr-2">•</span>
                      {ingredientText}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-6">
                Instructions
              </h3>
              <RecipeInstructionList steps={instructions} />
            </div>
          </CardContent>
        </Card>

        {user && (
          <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 border-2 border-[hsl(var(--paprika))]/20">
              <RecipeFeedbackForm
                variant="dialog"
                recipeId={recipe.id}
                weekNumber={weekNumber}
                existingFeedback={feedbackData}
                onFeedbackSubmitted={() => setShowFeedbackModal(false)}
                onSkip={isCompleted ? undefined : handleCompleteWithoutFeedback}
                skipLabel="Complete without feedback"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
