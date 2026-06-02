"use client";

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
import { UserRecipeProgress } from "@/types";
import { useQueries } from "@tanstack/react-query";
import {
  Calendar,
  Flame,
  Frown,
  SmilePlus,
  Target,
  ThumbsUp,
} from "lucide-react";
import { useMemo } from "react";

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
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-heading font-bold text-3xl text-[#262218]">
            Your Cooking Journey
          </h1>
          <p className="text-muted-foreground">
            Track your progress and celebrate your achievements
          </p>
        </div>

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

        {/* Feedback Distribution */}
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

        {/* User Info */}
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
                  <span className="font-medium">{user.cuisine}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Skill Level:
                  </span>{" "}
                  <span className="font-medium capitalize">
                    {user.skill_level}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Meals per Week:
                  </span>{" "}
                  <span className="font-medium">{user.frequency}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Goal:
                  </span>{" "}
                  <span className="font-medium">{user.user_goal}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
