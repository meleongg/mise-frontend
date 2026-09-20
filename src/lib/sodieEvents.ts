/** Cross-component Sodie launcher triggers (recipe page → floating chat). */
export const SODIE_PROPOSE_EDIT_EVENT = "mise:sodie-propose-edit";

export function requestSodieProposeEdit(recipeId: string) {
  window.dispatchEvent(
    new CustomEvent(SODIE_PROPOSE_EDIT_EVENT, { detail: { recipeId } })
  );
}
