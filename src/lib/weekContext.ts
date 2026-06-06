import { ReadonlyURLSearchParams } from "next/navigation";

import type { WeeklyPlan } from "@/types";

export type RecipeRepeatPreference = "standard" | "sooner";

export const RECIPE_COOLDOWN_WEEKS_LABEL: Record<
  RecipeRepeatPreference,
  string
> = {
  standard: "2 weeks",
  sooner: "1 week",
};

export function getRecipeCooldownLabel(
  preference: RecipeRepeatPreference | string | undefined
): string {
  if (preference === "sooner") {
    return RECIPE_COOLDOWN_WEEKS_LABEL.sooner;
  }
  return RECIPE_COOLDOWN_WEEKS_LABEL.standard;
}

export function getRecipeCooldownDays(
  preference: RecipeRepeatPreference | string | undefined
): number {
  return preference === "sooner" ? 7 : 14;
}

export function formatRecipeDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type RecipePlanAvailabilityInput = {
  preference?: RecipeRepeatPreference | string;
  /** When the recipe was added to a weekly plan (cooldown anchor). */
  planAddedAt?: string | null;
  completedAt?: string | null;
  now?: Date;
};

/** User-facing copy for plan-repeat cooldown (respects Settings preference). */
export function getRecipePlanAvailabilityCopy({
  preference,
  planAddedAt,
  completedAt,
  now = new Date(),
}: RecipePlanAvailabilityInput): {
  completedLine: string | null;
  availabilityLine: string;
} {
  const cooldownDays = getRecipeCooldownDays(preference);
  const cooldownLabel = getRecipeCooldownLabel(preference);

  const completedLine = completedAt
    ? `Completed ${formatRecipeDate(completedAt)}`
    : null;

  const anchorIso = planAddedAt ?? completedAt;
  if (!anchorIso) {
    return {
      completedLine,
      availabilityLine: `Recipes from your recent plans or swaps typically stay out of new plans for about ${cooldownLabel} (see Settings).`,
    };
  }

  const eligibleAfter = new Date(anchorIso);
  eligibleAfter.setDate(eligibleAfter.getDate() + cooldownDays);

  if (now >= eligibleAfter) {
    return {
      completedLine,
      availabilityLine: "Eligible to appear in new weekly plans again.",
    };
  }

  return {
    completedLine,
    availabilityLine: `May appear in new plans after ${formatRecipeDate(eligibleAfter.toISOString())} (${cooldownLabel} from when it was on your plan).`,
  };
}

/** Pre-swap copy: swapping today starts a new cooldown for the replaced recipe. */
export function getSwapOutAvailabilityCopy(
  preference?: RecipeRepeatPreference | string,
  swapDate: Date = new Date()
): string {
  const cooldownDays = getRecipeCooldownDays(preference);
  const cooldownLabel = getRecipeCooldownLabel(preference);
  const eligibleAfter = new Date(swapDate);
  eligibleAfter.setDate(eligibleAfter.getDate() + cooldownDays);

  return `If you swap today, this recipe may appear again after ${formatRecipeDate(eligibleAfter.toISOString())} (${cooldownLabel} from the swap date).`;
}

export function getActiveWeek(
  weeklyPlans: Pick<WeeklyPlan, "week_number">[] | undefined | null
): number {
  if (!weeklyPlans?.length) return 0;
  return Math.max(...weeklyPlans.map((plan) => plan.week_number));
}

export function resolveViewingWeek(
  searchParams: ReadonlyURLSearchParams | null,
  activeWeek: number,
  availableWeeks: number[]
): number {
  const raw = searchParams?.get("week");
  if (raw != null && raw !== "") {
    const parsed = parseInt(raw, 10);
    if (
      !Number.isNaN(parsed) &&
      parsed > 0 &&
      availableWeeks.includes(parsed)
    ) {
      return parsed;
    }
  }
  return activeWeek > 0 ? activeWeek : (availableWeeks[0] ?? 1);
}

export function isPastWeek(viewingWeek: number, activeWeek: number): boolean {
  return activeWeek > 0 && viewingWeek < activeWeek;
}

export function sortWeekNumbersDesc(weekNumbers: number[]): number[] {
  return [...weekNumbers].sort((a, b) => b - a);
}
