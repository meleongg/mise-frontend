import { COOKING_GOALS, CUISINE_OPTIONS, SKILL_LEVELS } from "@/constants";

/** Map stored goal key (e.g. "cuisine") to onboarding label text. */
export function getCookingGoalLabel(
  goalKey: string | null | undefined
): string {
  if (!goalKey) return "—";
  const match = COOKING_GOALS.find(
    (g) => g.value === goalKey || g.label === goalKey
  );
  return match?.label ?? goalKey;
}

export function getSkillLevelLabel(
  skillKey: string | null | undefined
): string {
  if (!skillKey) return "—";
  const match = SKILL_LEVELS.find(
    (s) => s.value === skillKey || s.label === skillKey
  );
  return match?.label ?? skillKey;
}

export function getCuisineLabel(cuisine: string | null | undefined): string {
  if (!cuisine) return "—";
  const match = CUISINE_OPTIONS.find(
    (c) => c.value === cuisine || c.label === cuisine
  );
  return match?.label ?? cuisine;
}
