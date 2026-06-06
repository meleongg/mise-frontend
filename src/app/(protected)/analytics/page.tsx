"use client";

import SodiePageIntro from "@/components/SodiePageIntro";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks";
import {
  queryKeys,
  useUserProgressQuery,
  useWeeklyPlansQuery,
} from "@/hooks/queries";
import { api } from "@/lib/api";
import {
  getCookingGoalLabel,
  getCuisineLabel,
  getSkillLevelLabel,
} from "@/lib/profileLabels";
import {
  formatRecipeDate,
  getRecipeCooldownDays,
  getRecipeCooldownLabel,
  getRecipePlanAvailabilityCopy,
} from "@/lib/weekContext";
import { Recipe, UserRecipeProgress } from "@/types";
import { useQueries } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Flame,
  Frown,
  SmilePlus,
  Target,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const FEEDBACK_LABELS: Record<string, string> = {
  too_easy: "Too easy",
  just_right: "Just right",
  too_hard: "Too hard",
};

type WeekHistoryGroup = {
  weekNumber: number;
  planAddedAt: string | null;
  completedRecipes: Array<{
    recipeId: string;
    recipeName: string;
    feedbackLabel: string | null;
    completedAt: string | null;
  }>;
};

interface AnalyticsData {
  totalWeeks: number;
  totalRecipes: number;
  completedRecipes: number;
  completionRate: number;
  averageDifficulty: string;
  currentStreak: number;
  feedbackDistribution: {
    too_easy: number;
    just_right: number;
    too_hard: number;
  };
}

export default function AnalyticsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { data: weeklyPlans, isLoading: plansLoading } = useWeeklyPlansQuery(
    user?.id
  );
  const { data: userProgress, isLoading: progressLoading } =
    useUserProgressQuery(user?.id);

  // Use TanStack Query's useQueries to fetch all weeks' progress with caching
  const progressQueries = useQueries({
    queries: (weeklyPlans || []).map((plan) => ({
      queryKey: queryKeys.recipeProgress(user?.id ?? "", plan.week_number),
      queryFn: () =>
        api.getWeeklyRecipeProgress(user?.id ?? "", plan.week_number),
      enabled: !!user?.id,
      staleTime: 1 * 60 * 1000, // 1 minute - matches other progress queries
    })),
  });

  // Flatten all progress data from cached queries
  const allRecipeProgress = useMemo(() => {
    return progressQueries
      .filter((query) => query.data)
      .flatMap((query) => query.data as UserRecipeProgress[]);
  }, [progressQueries]);

  const isLoadingProgress = progressQueries.some((query) => query.isLoading);

  // Calculate analytics from the loaded data using useMemo to prevent infinite loops
  const analytics = useMemo<AnalyticsData>(() => {
    if (!userProgress || !weeklyPlans) {
      return {
        totalWeeks: 0,
        totalRecipes: 0,
        completedRecipes: 0,
        completionRate: 0,
        averageDifficulty: "N/A",
        currentStreak: 0,
        feedbackDistribution: {
          too_easy: 0,
          just_right: 0,
          too_hard: 0,
        },
      };
    }

    const totalWeeks = weeklyPlans.length;
    const totalRecipes = userProgress.total_recipes;
    const completedRecipes = userProgress.completed_recipes;
    // Backend returns completion_rate as decimal (0-1), convert to percentage
    const completionRate = userProgress.completion_rate * 100;

    // Calculate feedback distribution
    const feedbackDistribution = allRecipeProgress.reduce(
      (acc, progress) => {
        if (progress.feedback) {
          acc[progress.feedback as keyof typeof acc]++;
        }
        return acc;
      },
      { too_easy: 0, just_right: 0, too_hard: 0 }
    );

    // Determine average difficulty
    const totalFeedback =
      feedbackDistribution.too_easy +
      feedbackDistribution.just_right +
      feedbackDistribution.too_hard;
    let averageDifficulty = "N/A";
    if (totalFeedback > 0) {
      if (feedbackDistribution.just_right / totalFeedback > 0.5) {
        averageDifficulty = "Just Right";
      } else if (
        feedbackDistribution.too_easy > feedbackDistribution.too_hard
      ) {
        averageDifficulty = "Too Easy";
      } else {
        averageDifficulty = "Too Hard";
      }
    }

    // Calculate current streak (consecutive weeks with at least one recipe completed)
    // Start from current week and go backwards
    let currentStreak = 0;
    const sortedPlans = [...weeklyPlans].sort(
      (a, b) => b.week_number - a.week_number
    );

    // Find the most recent week with any completed recipes first
    let streakStarted = false;
    for (const plan of sortedPlans) {
      const weekProgress = allRecipeProgress.filter(
        (p) => p.week_number === plan.week_number && p.feedback !== null
      );

      if (weekProgress.length > 0) {
        streakStarted = true;
        currentStreak++;
      } else if (streakStarted) {
        // Once we've started counting and hit a week with no completed recipes, stop
        break;
      }
    }

    return {
      totalWeeks,
      totalRecipes,
      completedRecipes,
      completionRate,
      averageDifficulty,
      currentStreak,
      feedbackDistribution,
    };
  }, [userProgress, weeklyPlans, allRecipeProgress]);

  const cookingHistory = useMemo<WeekHistoryGroup[]>(() => {
    if (!weeklyPlans?.length) return [];

    const recipeNameById = new Map<string, string>();
    const planAddedAtByWeek = new Map<number, string>();
    for (const plan of weeklyPlans) {
      planAddedAtByWeek.set(plan.week_number, plan.created_at);
      for (const recipe of plan.recipes as Recipe[]) {
        recipeNameById.set(recipe.id, recipe.name);
      }
    }

    const grouped = new Map<number, WeekHistoryGroup["completedRecipes"]>();
    for (const progress of allRecipeProgress) {
      if (progress.status !== "completed") continue;
      const weekEntries = grouped.get(progress.week_number) ?? [];
      weekEntries.push({
        recipeId: progress.recipe_id,
        recipeName: recipeNameById.get(progress.recipe_id) ?? "Unknown recipe",
        feedbackLabel: progress.feedback
          ? (FEEDBACK_LABELS[progress.feedback] ?? progress.feedback)
          : null,
        completedAt: progress.completed_at ?? null,
      });
      grouped.set(progress.week_number, weekEntries);
    }

    return [...grouped.entries()]
      .sort(([weekA], [weekB]) => weekB - weekA)
      .map(([weekNumber, completedRecipes]) => ({
        weekNumber,
        planAddedAt: planAddedAtByWeek.get(weekNumber) ?? null,
        completedRecipes,
      }));
  }, [weeklyPlans, allRecipeProgress]);

  const cooldownLabel = getRecipeCooldownLabel(user?.recipe_repeat_preference);
  const cooldownDays = getRecipeCooldownDays(user?.recipe_repeat_preference);

  if (userLoading || plansLoading || progressLoading || isLoadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20 p-6 md:p-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <SodiePageIntro
          title="Your Cooking Journey"
          description="See how you're growing in the kitchen — Sodie cheers on every milestone."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Weeks */}
          <Card className="border-2 border-[hsl(var(--paprika))]/40 bg-white">
            <CardHeader className="pb-4">
              <CardDescription className="text-sm">Total Weeks</CardDescription>
              <CardTitle className="text-3xl font-bold text-[hsl(var(--paprika))]">
                {analytics.totalWeeks}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meal plans generated
              </p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="border-2 border-[hsl(var(--sage))]/40 bg-white">
            <CardHeader className="pb-4">
              <CardDescription className="text-sm">
                Completion Rate
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-[hsl(var(--sage))]">
                {analytics.completionRate.toFixed(0)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {analytics.completedRecipes} of {analytics.totalRecipes} recipes
              </p>
            </CardContent>
          </Card>

          {/* Current Streak */}
          <Card className="border-2 border-orange-400/40 bg-white">
            <CardHeader className="pb-4">
              <CardDescription className="text-sm">
                Current Streak
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-orange-500">
                {analytics.currentStreak}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Consecutive weeks
              </p>
            </CardContent>
          </Card>

          {/* Average Difficulty */}
          <Card className="border-2 border-blue-400/40 bg-white">
            <CardHeader className="pb-4">
              <CardDescription className="text-sm">
                Average Difficulty
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-500">
                {analytics.averageDifficulty}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Recipe challenge level
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-[hsl(var(--paprika))]/40 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl text-[#262218]">
              Cooking History
            </CardTitle>
            <CardDescription>
              Recipes you&apos;ve completed, grouped by week. Your setting is{" "}
              {cooldownDays} days ({cooldownLabel}) before a recipe from your
              plans or swaps can appear again — each entry shows when you
              finished and when it may return.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cookingHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">
                No completed recipes yet — finish a dish from your weekly plan
                to see it here.
              </p>
            ) : (
              <div className="space-y-6">
                {cookingHistory.map((weekGroup) => (
                  <div
                    key={weekGroup.weekNumber}
                    className="rounded-xl border border-[hsl(var(--paprika))]/15 bg-amber-50/30 p-4 space-y-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-heading font-semibold text-[#262218]">
                        Week {weekGroup.weekNumber}
                      </h3>
                      <Link
                        href={`/weekly-plan?week=${weekGroup.weekNumber}`}
                        className="text-sm font-medium text-[hsl(var(--paprika))] hover:underline"
                      >
                        View full week
                      </Link>
                    </div>
                    <ul className="space-y-2">
                      {weekGroup.completedRecipes.map((entry) => {
                        const availability = getRecipePlanAvailabilityCopy({
                          preference: user?.recipe_repeat_preference,
                          planAddedAt: weekGroup.planAddedAt,
                          completedAt: entry.completedAt,
                        });

                        return (
                          <li
                            key={`${weekGroup.weekNumber}-${entry.recipeId}`}
                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white/80 px-3 py-2.5 border border-border/40"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-[#262218] truncate">
                                {entry.recipeName}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">
                                {entry.feedbackLabel
                                  ? `Rated: ${entry.feedbackLabel}`
                                  : "No difficulty rating"}
                                {entry.completedAt
                                  ? ` · Completed ${formatRecipeDate(entry.completedAt)}`
                                  : ""}
                              </p>
                              <p className="text-xs text-muted-foreground/90 font-body mt-0.5">
                                {availability.availabilityLine}
                              </p>
                            </div>
                            <Link
                              href={`/recipe/${entry.recipeId}?week=${weekGroup.weekNumber}`}
                              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[hsl(var(--sage))] hover:underline shrink-0"
                            >
                              <Check className="w-4 h-4" />
                              View recipe
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback + profile: side-by-side on large screens so bars aren't full-bleed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-[hsl(var(--paprika))]/40 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-xl text-[#262218]">
                Feedback Distribution
              </CardTitle>
              <CardDescription>
                How you&apos;re finding the recipes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Too Easy */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <SmilePlus className="w-4 h-4" />
                      Too Easy
                    </span>
                    <span className="text-muted-foreground">
                      {analytics.feedbackDistribution.too_easy} recipes
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          analytics.completedRecipes > 0
                            ? (analytics.feedbackDistribution.too_easy /
                                analytics.completedRecipes) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Just Right */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Just Right
                    </span>
                    <span className="text-muted-foreground">
                      {analytics.feedbackDistribution.just_right} recipes
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[hsl(var(--sage))] h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          analytics.completedRecipes > 0
                            ? (analytics.feedbackDistribution.just_right /
                                analytics.completedRecipes) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Too Hard */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Frown className="w-4 h-4" />
                      Too Hard
                    </span>
                    <span className="text-muted-foreground">
                      {analytics.feedbackDistribution.too_hard} recipes
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          analytics.completedRecipes > 0
                            ? (analytics.feedbackDistribution.too_hard /
                                analytics.completedRecipes) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {user && (
            <Card className="border-2 border-[hsl(var(--paprika))]/40 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-xl text-[#262218]">
                  Your Preferences
                </CardTitle>
                <CardDescription>Current cooking profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Cuisine:
                    </span>{" "}
                    <span className="font-medium">
                      {getCuisineLabel(user.cuisine)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Skill Level:
                    </span>{" "}
                    <span className="font-medium">
                      {getSkillLevelLabel(user.skill_level)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Meals per Week:
                    </span>{" "}
                    <span className="font-medium">{user.frequency}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-muted-foreground">
                      Goal:
                    </span>{" "}
                    <span className="font-medium">
                      {getCookingGoalLabel(user.user_goal)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
