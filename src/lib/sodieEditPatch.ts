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

function ingredientMeasure(item: unknown): string {
  if (typeof item === "string") return "";
  if (item && typeof item === "object" && "measure" in item) {
    return String((item as { measure: unknown }).measure ?? "");
  }
  return "";
}

function halveMeasure(measure: string): string {
  const trimmed = measure.trim();
  if (!trimmed) return "reduced amount";
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?(.*)$/);
  if (!match) return `${trimmed} (reduced)`;
  const whole = Number(match[1]);
  const denom = match[2] ? Number(match[2]) : null;
  const rest = (match[3] || "").trim();
  let value = denom ? whole / denom : whole;
  if (!Number.isFinite(value) || value <= 0) return `${trimmed} (reduced)`;
  value = value / 2;
  const display =
    Number.isInteger(value) || value >= 1
      ? String(Number(value.toFixed(2)))
      : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${display}${rest ? ` ${rest}` : ""}`.trim();
}

function withIngredient(
  item: unknown,
  next: { name: string; measure: string }
): unknown {
  if (typeof item === "string") {
    return next.measure ? `${next.measure} ${next.name}` : next.name;
  }
  return { name: next.name, measure: next.measure };
}

/** True when the follow-up is asking about the pending diff, not changing it. */
export function isClarifyFollowUp(userRequest: string): boolean {
  const text = userRequest.trim();
  const editSignal =
    /\b(add|remove|less|fewer|more|reduce|increase|change|replace|without|include|cut|halve|double|rename|title|servings?)\b/i.test(
      text
    );
  if (editSignal) return false;
  return (
    /\?$/.test(text) ||
    /^(why|what|how|does|will|is|are|can you explain|could you explain|tell me more)\b/i.test(
      text
    )
  );
}

/**
 * Build an allowlisted edit patch from the user's natural-language request.
 * Full user sentence belongs in proposal.rationale — not forced into notes.
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
  // "less sugar", "reduce the sugar", "include less sugar …"
  const reduceMatch = request.match(
    /\b(?:(?:include|use|with)\s+)?(?:less|fewer|reduce(?:d)?|lower|cut(?:\s+back)?(?:\s+on)?|decrease|halve)\s+(?:the\s+|some\s+)?([a-z][a-z\s-]{0,30}?)(?:\s+(?:in|from|but|and|while|so|to)\b|[.?!]|$)/i
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
    !removeMatch &&
    !reduceMatch;

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
  } else if (reduceMatch?.[1]) {
    const target = reduceMatch[1].trim().toLowerCase().replace(/\s+/g, " ");
    let changed = false;
    const next = ingredients.map((item) => {
      if (!ingredientName(item).includes(target.split(" ")[0] || target)) {
        return item;
      }
      changed = true;
      const name = ingredientName(item);
      const measure = ingredientMeasure(item);
      return withIngredient(item, {
        name,
        measure: halveMeasure(measure),
      });
    });
    if (changed) {
      patch.ingredients = next;
    }
  }

  if (servingsMatch?.[1]) {
    patch.servings = servingsMatch[1].trim();
  }

  if (renameMatch?.[1]) {
    patch.title = renameMatch[1].trim();
  }

  if (notesOnly || Object.keys(patch).length === 0) {
    patch.notes = request;
  }

  return patch;
}

export function patchChangesContent(patch: RecipeEditPatch): boolean {
  return Boolean(
    patch.ingredients || patch.servings || patch.title || patch.instructions
  );
}
