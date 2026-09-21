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

function ingredientName(item: unknown): string {
  if (typeof item === "string") return item.toLowerCase();
  if (item && typeof item === "object" && "name" in item) {
    return String((item as { name: unknown }).name).toLowerCase();
  }
  return String(item).toLowerCase();
}

/**
 * Build an allowlisted edit patch from the user's natural-language request.
 * Maps the ask onto the right field (ingredients/servings/title/notes) — the
 * full user sentence stays in proposal.rationale, not forced into notes.
 */
export function buildEditPatchFromRequest(
  recipe: Recipe,
  userRequest: string
): RecipeEditPatch {
  const request = userRequest.trim();
  const ingredients = parseIngredients(recipe.ingredients);
  const patch: RecipeEditPatch = {};

  const addMatch = request.match(
    /\b(?:add|include|mix in|throw in|put)(?:\s+(?:in|some|a|an|the))?\s+(.+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:recipe|ingredients?|batter|dough|mix|cookies?))?[.?!]?$/i
  );
  const removeMatch = request.match(
    /\b(?:remove|drop|skip|without|no)\s+(.+?)(?:\s+from\s+(?:the\s+)?(?:recipe|ingredients?))?[.?!]?$/i
  );
  const servingsMatch = request.match(
    /\b(?:serves?|servings?|portion(?:s| size)?|make it for)\s+(\d+\s*(?:-\s*\d+)?(?:\s*(?:people|servings?|portions?))?)/i
  );
  const renameMatch = request.match(
    /\b(?:rename(?:\s+(?:it|this|the recipe))?|call it|title(?:\s+it)?)\s+(?:to\s+|as\s+)?["']?(.+?)["']?[.?!]?$/i
  );
  const notesOnly =
    /\b(note|notes|tip|remind me|remember)\b/i.test(request) &&
    !addMatch &&
    !removeMatch;

  if (addMatch?.[1]) {
    const addition = addMatch[1].trim().replace(/^["']|["']$/g, "");
    if (addition) {
      ingredients.push({ name: addition.toLowerCase(), measure: "to taste" });
      patch.ingredients = ingredients;
    }
  } else if (removeMatch?.[1]) {
    const target = removeMatch[1].trim().toLowerCase();
    const filtered = ingredients.filter(
      (item) => !ingredientName(item).includes(target)
    );
    if (filtered.length !== ingredients.length) {
      patch.ingredients = filtered;
    }
  }

  if (servingsMatch?.[1]) {
    patch.servings = servingsMatch[1].trim();
  }

  if (renameMatch?.[1]) {
    patch.title = renameMatch[1].trim();
  }

  if (notesOnly || Object.keys(patch).length === 0) {
    // Only use notes when the user is clearly asking for a note, or we could not
    // map the ask onto ingredients/servings/title. Rationale still stores the
    // full user sentence separately on the proposal.
    patch.notes = request;
  }

  return patch;
}
