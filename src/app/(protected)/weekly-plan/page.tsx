"use client";

import SwapRecipeModal from "@/components/SwapRecipeModal";
import SodieEmptyState from "@/components/SodieEmptyState";
import SodieCommandBar from "@/components/SodieCommandBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import {
  queryKeys,
  useNextWeekEligibilityQuery,
  useSwapRecipeMutation,
  useToggleRecipeStatusMutation,
  useWeeklyPlansQuery,
  useWeeklyRecipeProgressQuery,
} from "@/hooks/queries";
import { api, ApiError } from "@/lib/api";
import { clearKitchenSession } from "@/lib/kitchenSessionStorage";
import {
  Recipe,
  RecipeScheduleItem,
  WeeklyPlan,
  WeeklyPlanResponse,
} from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  Check,
  PartyPopper,
  Rocket,
  RotateCcw,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WeeklyPlanPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<WeeklyPlanResponse | null>(
    null
  );
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [swapError, setSwapError] = useState("");
  const [toggleError, setToggleError] = useState("");

  const { user, isLoading: userLoading } = useUser();
  const { state, dispatch } = useApp();
  const currentWeek = state.currentWeek;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Mutations for swapping recipes and toggling status
  const swapMutation = useSwapRecipeMutation();
  const toggleStatusMutation = useToggleRecipeStatusMutation();

  // TanStack Query hooks - automatically cached from layout
  const {
    data: weeklyPlans,
    isLoading: plansLoading,
    error,
  } = useWeeklyPlansQuery(user?.id);
  const { data: recipeProgress } = useWeeklyRecipeProgressQuery(
    user?.id,
    currentWeek
  );
  const { data: nextWeekEligibility, isLoading: eligibilityLoading } =
    useNextWeekEligibilityQuery(user?.id);

  // Helper to check if recipe is completed
  const getRecipeProgress = (recipeId: string, weekNumber: number) => {
    if (!recipeProgress) return undefined;
    return recipeProgress.find(
      (p) => p.recipe_id === recipeId && p.week_number === weekNumber
    );
  };

  const isRecipeCompleted = (recipeId: string, weekNumber: number): boolean => {
    return getRecipeProgress(recipeId, weekNumber)?.status === "completed";
  };

  const isRecipeInProgress = (
    recipeId: string,
    weekNumber: number
  ): boolean => {
    return getRecipeProgress(recipeId, weekNumber)?.status === "in_progress";
  };

  // Helper to convert WeeklyPlanResponse to WeeklyPlan
  const convertToWeeklyPlan = (response: WeeklyPlanResponse): WeeklyPlan => ({
    ...response,
    created_at: response.generated_at,
    recipe_schedule: response.recipe_schedule,
  });

  // Helper to get recipes sorted by order from recipe_schedule
  const getSortedRecipes = (plan: WeeklyPlan | null) => {
    if (!plan) return [];

    try {
      const schedule: RecipeScheduleItem[] = plan.recipe_schedule
        ? JSON.parse(plan.recipe_schedule)
        : [];
      const sorted = [...plan.recipes].sort((a, b) => {
        const orderA =
          schedule.find((s) => s.recipe_id === a.id)?.order ?? Infinity;
        const orderB =
          schedule.find((s) => s.recipe_id === b.id)?.order ?? Infinity;
        return orderA - orderB;
      });
      return sorted;
    } catch {
      // Fallback to original order if recipe_schedule is malformed
      return plan.recipes;
    }
  };

  const getCurrentWeekPlan = (): WeeklyPlan | null => {
    if (!weeklyPlans) return null;
    // Prefer cached plans when available to reflect swaps and other updates
    const cachedPlan = weeklyPlans.find(
      (plan) => plan.week_number === currentWeek
    );
    if (cachedPlan) return cachedPlan;

    if (generatedPlan && generatedPlan.week_number === currentWeek) {
      return convertToWeeklyPlan(generatedPlan);
    }

    return null;
  };

  const currentPlan = getCurrentWeekPlan();
  const nextWeek =
    weeklyPlans && weeklyPlans.length > 0
      ? Math.max(...weeklyPlans.map((plan) => plan.week_number)) + 1
      : 1;

  // Determine if we're still initializing
  const isInitializing =
    !weeklyPlans ||
    (weeklyPlans.length > 0 && currentWeek === 0) ||
    (weeklyPlans.length > 0 && !currentPlan && !generatedPlan);

  // Redirect to onboarding if not authenticated
  useEffect(() => {
    if (!user && !userLoading) {
      router.push("/onboarding");
    }
  }, [user, userLoading, router]);

  // Initialize currentWeek to the most recent week when data loads
  useEffect(() => {
    if (!weeklyPlans || weeklyPlans.length === 0) return;

    const availableWeeks = weeklyPlans.map((plan) => plan.week_number);
    if (generatedPlan) {
      availableWeeks.push(generatedPlan.week_number);
    }

    const mostRecentWeek = Math.max(...availableWeeks);
    // Update to most recent week if current week doesn't exist in available plans
    // This handles initial load and avoids reverting after generating a new week
    const currentWeekExists = availableWeeks.includes(currentWeek);
    if (!currentWeekExists) {
      dispatch({ type: "SET_CURRENT_WEEK", payload: mostRecentWeek });
    }
  }, [weeklyPlans, generatedPlan, currentWeek, dispatch]);

  const isLoading = userLoading || plansLoading || eligibilityLoading;

  // Pre-compute all dynamic values to avoid template literal nesting in JSX
  const completedCount = currentPlan
    ? currentPlan.recipes.filter((recipe) =>
        isRecipeCompleted(recipe.id, currentPlan.week_number)
      ).length
    : 0;
  const totalCount = currentPlan ? currentPlan.recipes.length : 0;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const swapCount = currentPlan?.swap_count ?? 0;
  const progressWidth = `${progressPercentage}%`;
  const swapCounterClass =
    swapCount >= 3
      ? "bg-destructive/15 text-destructive"
      : "bg-[hsl(var(--turmeric))]/20 text-[#262218]";
  const nextWeekPlanText = nextWeekEligibility
    ? `Generate Week ${nextWeekEligibility.next_week} Plan`
    : "Generate Next Week Plan";
  const generatingText = nextWeekEligibility
    ? `Generating Week ${nextWeekEligibility.next_week}...`
    : "Generating...";

  const handleGenerateNextWeek = async () => {
    if (!user || !nextWeekEligibility?.can_generate) return;

    setIsGenerating(true);
    setGenerateError("");

    try {
      const plan = await api.generateNextWeekPlan(user.id);
      setGeneratedPlan(plan);

      // Update currentWeek to the newly generated week
      dispatch({ type: "SET_CURRENT_WEEK", payload: plan.week_number });

      // Invalidate queries to refetch fresh data
      await queryClient.invalidateQueries({
        queryKey: queryKeys.weeklyPlans(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipeProgress(user.id, plan.week_number),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.nextWeekEligibility(user.id),
      });
    } catch (err: unknown) {
      const error =
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error(String(err));
      setGenerateError(
        error.message || "Failed to generate next week plan. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateInitialWeek = async () => {
    if (!user) return;

    setIsGenerating(true);
    setGenerateError("");

    try {
      const initialIntent = `Create a weekly meal plan for week ${nextWeek} for a user who prefers ${user.cuisine} cuisine, wants ${user.frequency} meals per week, is a ${user.skill_level} cook, and whose goal is ${user.user_goal}.`;
      const plan = await api.generateWeeklyPlan(user.id, initialIntent);
      setGeneratedPlan(plan);

      // Update currentWeek to the newly generated week
      dispatch({ type: "SET_CURRENT_WEEK", payload: plan.week_number });

      // Invalidate queries to refetch fresh data
      await queryClient.invalidateQueries({
        queryKey: queryKeys.weeklyPlans(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipeProgress(user.id, plan.week_number),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.nextWeekEligibility(user.id),
      });

      // Notify Sodie command bar to highlight after first plan
      window.dispatchEvent(new CustomEvent("firstPlanGenerated"));
    } catch (err: unknown) {
      const error =
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error(String(err));
      setGenerateError(
        error.message || "Failed to generate weekly plan. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwapClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSwapError("");
    setSwapModalOpen(true);
  };

  const handleSwapConfirm = async (context: string) => {
    if (!user || !selectedRecipe || !currentPlan) return;

    try {
      await swapMutation.mutateAsync({
        userId: user.id,
        request: {
          recipe_id_to_replace: selectedRecipe.id,
          week_number: currentPlan.week_number,
          swap_context: context,
        },
      });

      clearKitchenSession(selectedRecipe.id, currentPlan.week_number);

      // Cache invalidation is handled by useSwapRecipeMutation's onSuccess
      // Close modal and reset state
      setSwapModalOpen(false);
      setSelectedRecipe(null);
    } catch (err: unknown) {
      const error =
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error(String(err));
      const errorMsg =
        error.message === "Cannot swap a completed recipe"
          ? "Cannot swap a completed recipe"
          : error.message?.includes("Swap limit reached") ||
              error.message?.includes("3 swaps max")
            ? "Swap limit reached for this week (3 swaps max). Swaps reset when you generate next week's plan!"
            : error.message || "Failed to swap recipe. Please try again.";
      setSwapError(errorMsg);
    }
  };

  const handleMarkIncomplete = async (recipeId: string, weekNumber: number) => {
    if (!user) return;

    try {
      setToggleError("");
      await toggleStatusMutation.mutateAsync({
        userId: user.id,
        recipeId,
        weekNumber,
        request: { status: "not_started" },
      });

      // Cache invalidation is handled by useToggleRecipeStatusMutation's onSuccess
    } catch (err: unknown) {
      const error =
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error(String(err));
      const errorMsg =
        error.message ||
        "Failed to mark recipe as incomplete. Please try again.";
      setToggleError(errorMsg);
    }
  };

  // Only show full-screen loading if user is not authenticated yet
  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading your weekly plan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 py-8 bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20">
      <div className="w-full max-w-3xl">
        <SodieCommandBar hasActivePlan={Boolean(currentPlan)} />
      </div>
      <Card className="w-full max-w-3xl shadow-2xl border-2 border-[hsl(var(--paprika))]/60 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-heading font-bold text-3xl text-[#262218]">
            Your Weekly Meal Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-center mb-4">{String(error)}</div>
          )}
          {generateError && (
            <div className="text-red-600 text-center mb-4">{generateError}</div>
          )}

          {/* Show loading state while data is being fetched */}
          {isLoading || isInitializing ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading your weekly plan...
              </p>
            </div>
          ) : currentPlan ? (
            <div className="py-4">
              {/* Week Completion Banner */}
              {nextWeekEligibility?.can_generate && (
                <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-green-500 rounded-xl shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <PartyPopper className="w-12 h-12 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        Congratulations! Week {currentPlan.week_number}{" "}
                        Complete!
                      </h3>
                      <p className="text-green-700 mb-4">
                        You&apos;ve finished all recipes this week. Ready to
                        continue your culinary journey?
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateNextWeek}
                      disabled={isGenerating}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 transition-all transform hover:scale-105"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                          {generatingText}
                        </span>
                      ) : (
                        nextWeekPlanText
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Recipe Statistics & Progress */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="font-heading font-semibold text-lg text-[#262218] text-center sm:text-left">
                    Week {currentPlan.week_number} · {totalCount}{" "}
                    {totalCount === 1 ? "recipe" : "recipes"}
                  </p>
                  <span
                    className={`font-body text-xs px-3 py-1.5 rounded-full text-center sm:text-left ${swapCounterClass}`}
                  >
                    {swapCount >= 3 ? (
                      <>3/3 swaps used · resets next week</>
                    ) : (
                      <>
                        {swapCount}/3 swaps used · {3 - swapCount} remaining
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground font-body">
                    <span>
                      {completedCount} of {totalCount} completed
                    </span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              </div>

              {/* Recipe Cards Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {getSortedRecipes(currentPlan).map((recipe: Recipe) => (
                  <Card
                    key={recipe.id}
                    className="overflow-hidden group hover:shadow-2xl hover:border-[hsl(var(--paprika))]/60 transition-all duration-300 h-full flex flex-col relative border-2 border-gray-200"
                  >
                    <Link
                      href={`/recipe/${recipe.id}?week=${currentPlan.week_number}`}
                      className="absolute inset-0 z-[1] rounded-[inherit]"
                      aria-label={`View ${recipe.name}`}
                    />
                    {/* Completion Badge */}
                    {isRecipeCompleted(recipe.id, currentPlan.week_number) && (
                      <div className="absolute top-3 right-3 z-[2] pointer-events-none bg-[hsl(var(--sage))]/90 text-white px-3 py-1.5 rounded-full font-body font-semibold tracking-wider uppercase text-xs shadow-lg flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        <span>Completed</span>
                      </div>
                    )}
                    {isRecipeInProgress(recipe.id, currentPlan.week_number) &&
                      !isRecipeCompleted(
                        recipe.id,
                        currentPlan.week_number
                      ) && (
                        <div className="absolute top-3 right-3 z-[2] pointer-events-none bg-[hsl(var(--turmeric))]/90 text-[#262218] px-3 py-1.5 rounded-full font-body font-semibold tracking-wider uppercase text-xs shadow-lg flex items-center gap-1.5">
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>In progress</span>
                        </div>
                      )}

                    {recipe.image_url ? (
                      <div className="w-full h-48 overflow-hidden flex-shrink-0 relative pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 group-hover:from-black/30 transition-all" />
                        <Image
                          src={recipe.image_url}
                          alt={recipe.name}
                          width={400}
                          height={192}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 flex-shrink-0 pointer-events-none bg-gradient-to-br from-amber-100/80 via-orange-100/80 to-[hsl(var(--turmeric))]/40 flex items-center justify-center group-hover:from-amber-200/80 group-hover:via-orange-200/80 transition-all duration-300">
                        <div className="text-center px-4">
                          <UtensilsCrossed className="w-16 h-16 mx-auto mb-2 text-[hsl(var(--paprika))] group-hover:scale-110 transition-transform" />
                          <p className="text-sm font-semibold text-[hsl(var(--paprika))]">
                            {recipe.cuisine}
                          </p>
                        </div>
                      </div>
                    )}
                    <CardContent className="relative z-[2] p-4 flex-1 flex flex-col pointer-events-none">
                      <div className="font-heading font-bold text-lg text-[#262218] mb-1 group-hover:underline line-clamp-2">
                        {recipe.name}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        {recipe.cuisine}
                      </div>

                      {isRecipeInProgress(recipe.id, currentPlan.week_number) &&
                        !isRecipeCompleted(
                          recipe.id,
                          currentPlan.week_number
                        ) && (
                          <Link
                            href={`/recipe/${recipe.id}/cook?week=${currentPlan.week_number}&commit=1`}
                            className="pointer-events-auto mb-3 flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-semibold rounded-lg bg-[hsl(var(--paprika))] text-white hover:bg-[hsl(var(--primary))]/90 transition-colors"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                            Resume cooking
                          </Link>
                        )}

                      {/* Swap Button */}
                      <div className="mt-auto pt-4 border-t border-gray-200 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isCompleted = isRecipeCompleted(
                              recipe.id,
                              currentPlan.week_number
                            );
                            const swapLimitReached =
                              currentPlan.swap_count >= 3;
                            if (!isCompleted && !swapLimitReached) {
                              handleSwapClick(recipe);
                            }
                          }}
                          disabled={
                            isRecipeCompleted(
                              recipe.id,
                              currentPlan.week_number
                            ) || currentPlan.swap_count >= 3
                          }
                          title={
                            isRecipeCompleted(
                              recipe.id,
                              currentPlan.week_number
                            )
                              ? "Cannot swap completed recipes"
                              : currentPlan.swap_count >= 3
                                ? "Swap limit reached (3/3 swaps used)"
                                : "Swap this recipe"
                          }
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-[hsl(var(--paprika))] hover:bg-amber-100/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          Swap {swapCount >= 3 && "(Limit Reached)"}
                        </button>

                        {/* Mark as Incomplete Button */}
                        {isRecipeCompleted(
                          recipe.id,
                          currentPlan.week_number
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkIncomplete(
                                recipe.id,
                                currentPlan.week_number
                              );
                            }}
                            disabled={toggleStatusMutation.isPending}
                            title="Mark this recipe as incomplete"
                            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {toggleStatusMutation.isPending
                              ? "Marking..."
                              : "Mark Incomplete"}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Only show "no plan" UI when we know for sure there are no plans */
            weeklyPlans &&
            weeklyPlans.length === 0 && (
              <div className="text-center py-4">
                <SodieEmptyState
                  size="lg"
                  message="I'm Sodie — let's build your first week together!"
                />
                <p className="font-body text-muted-foreground mb-6 -mt-2">
                  {nextWeekEligibility?.message ||
                    "You don't have a weekly meal plan yet."}
                </p>
                <button
                  className="px-8 py-4 bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 text-white font-bold rounded-lg shadow-lg hover:from-orange-600 hover:to-[hsl(var(--paprika))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--paprika))] disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                  onClick={
                    nextWeekEligibility?.current_week === null
                      ? handleGenerateInitialWeek
                      : handleGenerateNextWeek
                  }
                  disabled={
                    isGenerating ||
                    (nextWeekEligibility?.current_week !== null &&
                      !nextWeekEligibility?.can_generate)
                  }
                  aria-label={
                    nextWeekEligibility?.current_week === null
                      ? `Generate Week ${nextWeek} Plan`
                      : `Generate Week ${nextWeekEligibility?.next_week} Plan`
                  }
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      Generating...
                    </span>
                  ) : nextWeekEligibility?.current_week === null ? (
                    <span className="flex items-center justify-center gap-2">
                      <Rocket className="w-5 h-5" />
                      Generate Week {nextWeek} Plan
                    </span>
                  ) : (
                    `Generate Week ${nextWeekEligibility?.next_week} Plan`
                  )}
                </button>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Swap Recipe Modal */}
      <SwapRecipeModal
        isOpen={swapModalOpen}
        recipeId={selectedRecipe?.id ?? ""}
        recipeName={selectedRecipe?.name ?? ""}
        weekNumber={currentPlan?.week_number ?? 0}
        onClose={() => {
          setSwapModalOpen(false);
          setSwapError("");
        }}
        onConfirm={handleSwapConfirm}
        isLoading={swapMutation.isPending}
      />

      {/* Swap Error Toast */}
      {swapError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-medium">{swapError}</p>
          <button
            onClick={() => setSwapError("")}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toggle Status Error Toast */}
      {toggleError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-medium">{toggleError}</p>
          <button
            onClick={() => setToggleError("")}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
