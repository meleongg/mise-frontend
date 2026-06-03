"use client";

import RecipeFeedbackForm from "@/components/RecipeFeedbackForm";
import RecipeInstructionList from "@/components/RecipeInstructionList";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import { useRecipeQuery, useWeeklyRecipeProgressQuery } from "@/hooks/queries";
import { parseHelpers } from "@/lib/api";
import { resolveRecipeWeek } from "@/lib/recipeWeek";
import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useState } from "react";

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const { state } = useApp();
  const weekNumber = resolveRecipeWeek(searchParams, state.currentWeek);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Fetch recipe using TanStack Query (automatic caching)
  const { data: recipe, isLoading } = useRecipeQuery(resolvedParams.id);
  const { data: recipeProgress } = useWeeklyRecipeProgressQuery(
    user?.id,
    weekNumber
  );

  // Check if this specific recipe has feedback/progress
  const existingFeedback = recipeProgress?.find(
    (p) => p.recipe_id === resolvedParams.id
  );
  const hasFeedback = existingFeedback?.status === "completed";
  const isInProgress = existingFeedback?.status === "in_progress";

  const feedbackData = existingFeedback?.feedback
    ? {
        feedback: existingFeedback.feedback,
        notes: existingFeedback.notes,
      }
    : undefined;

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
        <Button
          onClick={() => router.push("/weekly-plan")}
          variant="secondary"
          className="mb-4 font-semibold text-white bg-[hsl(var(--paprika))] border-none hover:bg-[hsl(var(--primary))]/90 transition-colors duration-200"
        >
          ← Back to weekly plan
        </Button>

        <Card className="shadow-2xl border-2 border-[hsl(var(--paprika))]/60 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <SodieAvatar
                  size="lg"
                  animate="idle"
                  className="shrink-0 hidden sm:block"
                />
                <SodieAvatar
                  size="md"
                  animate="idle"
                  className="shrink-0 sm:hidden"
                />
                <CardTitle className="font-heading font-bold text-3xl text-[#262218]">
                  {recipe.name}
                </CardTitle>
              </div>
              {user && (
                <Button
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                  className={`md:w-fit font-semibold border-2 shadow-md hover:shadow-lg transition-all ${
                    hasFeedback
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-700"
                      : "bg-[hsl(var(--paprika))] text-white border-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 transition-colors duration-200"
                  }`}
                  size="sm"
                >
                  {hasFeedback && "✓ "}
                  {showFeedbackForm
                    ? "Hide"
                    : hasFeedback
                      ? "Update"
                      : "Feedback"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.name}
                width={800}
                height={384}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full h-48 md:h-64 rounded-lg shadow-md bg-gradient-to-br from-amber-100 via-orange-50 to-[hsl(var(--turmeric))]/40 flex flex-col items-center justify-center gap-3 border border-[hsl(var(--paprika))]/20">
                <SodieAvatar size="xl" animate="idle" />
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
              {recipe.prep_time_minutes && (
                <div>
                  <span className="font-semibold text-primary">Prep Time:</span>
                  <p className="text-muted-foreground">
                    {recipe.prep_time_minutes} min
                  </p>
                </div>
              )}
              {recipe.cook_time_minutes && (
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

            {user && !hasFeedback && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ready when you are — I&apos;ll walk you through each step in
                  kitchen mode.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 h-14 text-lg font-semibold bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white shadow-lg"
                  >
                    <Link
                      href={`/recipe/${recipe.id}/cook?week=${weekNumber}&commit=1`}
                    >
                      <UtensilsCrossed className="w-5 h-5 mr-2" />
                      {isInProgress
                        ? "Resume cooking with Sodie"
                        : "Start cooking with Sodie"}
                    </Link>
                  </Button>
                  {!isInProgress && (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="flex-1 h-14 text-base border-2 border-[hsl(var(--paprika))]/40"
                    >
                      <Link
                        href={`/recipe/${recipe.id}/cook?week=${weekNumber}&preview=1`}
                      >
                        Preview steps
                      </Link>
                    </Button>
                  )}
                </div>
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
          <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0">
              <RecipeFeedbackForm
                recipeId={recipe.id}
                weekNumber={weekNumber}
                existingFeedback={feedbackData}
                onFeedbackSubmitted={() => {
                  setShowFeedbackForm(false);
                  // Progress is now automatically updated via useFeedback hook
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
