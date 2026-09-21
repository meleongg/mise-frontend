/** Cross-component Sodie launcher triggers (recipe page → floating chat). */

/** Opens Ask Sodie in recipe-edit mode and asks what to change (no proposal yet). */
export const SODIE_START_RECIPE_EDIT_EVENT = "mise:sodie-start-recipe-edit";

/** Opens the global Ask Sodie FAB, optionally with a draft composer value. */
export const SODIE_OPEN_EVENT = "mise:sodie-open";

/** @deprecated Use SODIE_START_RECIPE_EDIT_EVENT */
export const SODIE_PROPOSE_EDIT_EVENT = SODIE_START_RECIPE_EDIT_EVENT;

export type SodieOpenDetail = {
  draft?: string;
};

export function requestSodieRecipeEdit(recipeId: string) {
  window.dispatchEvent(
    new CustomEvent(SODIE_START_RECIPE_EDIT_EVENT, { detail: { recipeId } })
  );
}

/** Open the floating Ask Sodie panel; optionally prefill the composer. */
export function requestSodieOpen(detail: SodieOpenDetail = {}) {
  window.dispatchEvent(new CustomEvent(SODIE_OPEN_EVENT, { detail }));
}

/** @deprecated Use requestSodieRecipeEdit */
export function requestSodieProposeEdit(recipeId: string) {
  requestSodieRecipeEdit(recipeId);
}
