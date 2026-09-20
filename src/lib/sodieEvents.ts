/** Cross-component Sodie launcher triggers (recipe page → floating chat). */

/** Opens Ask Sodie in recipe-edit mode and asks what to change (no proposal yet). */
export const SODIE_START_RECIPE_EDIT_EVENT = "mise:sodie-start-recipe-edit";

/** @deprecated Use SODIE_START_RECIPE_EDIT_EVENT */
export const SODIE_PROPOSE_EDIT_EVENT = SODIE_START_RECIPE_EDIT_EVENT;

export function requestSodieRecipeEdit(recipeId: string) {
  window.dispatchEvent(
    new CustomEvent(SODIE_START_RECIPE_EDIT_EVENT, { detail: { recipeId } })
  );
}

/** @deprecated Use requestSodieRecipeEdit */
export function requestSodieProposeEdit(recipeId: string) {
  requestSodieRecipeEdit(recipeId);
}
