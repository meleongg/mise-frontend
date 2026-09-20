import type { Recipe, RecipeEditPatch } from "@/types";

function parseIngredients(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return [...raw];
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? [...parsed] : [];
  } catch {
    return raw.trim() ? [raw] : [];
  }
}

/**
 * Build an allowlisted edit patch from the user's natural-language request.
 * Prefer additive ingredient changes when the user says "add …".
 */
export function buildEditPatchFromRequest(
  recipe: Recipe,
  userRequest: string
): RecipeEditPatch {
  const request = userRequest.trim();
  const ingredients = parseIngredients(recipe.ingredients);
  const addMatch = request.match(
    /\badd(?:\s+(?:in|some))?\s+(.+?)(?:\s+to\s+(?:the\s+)?(?:recipe|ingredients?|batter|dough|mix))?[.?!]?$/i
  );

  const patch: RecipeEditPatch = {
    notes: request,
  };

  if (addMatch?.[1]) {
    const addition = addMatch[1].trim().replace(/^["']|["']$/g, "");
    if (addition) {
      ingredients.push({ name: addition.toLowerCase(), measure: "to taste" });
      patch.ingredients = ingredients;
    }
  }

  return patch;
}
