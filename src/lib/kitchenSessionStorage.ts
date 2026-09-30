const STORAGE_PREFIX = "chefpath-kitchen";

export function kitchenSessionKey(
  recipeId: string,
  weekNumber: number
): string {
  return `${STORAGE_PREFIX}:${recipeId}:${weekNumber}`;
}

export interface KitchenSessionState {
  currentStepIndex: number;
  checkedIngredients: number[];
  /** Running timers persisted as absolute end times (ms epoch). */
  timers?: Array<{
    id: string;
    label: string;
    endsAt: number;
    totalSeconds: number;
  }>;
}

export function loadKitchenSession(
  recipeId: string,
  weekNumber: number
): KitchenSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(kitchenSessionKey(recipeId, weekNumber));
    if (!raw) return null;
    return JSON.parse(raw) as KitchenSessionState;
  } catch {
    return null;
  }
}

export function saveKitchenSession(
  recipeId: string,
  weekNumber: number,
  state: KitchenSessionState
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    kitchenSessionKey(recipeId, weekNumber),
    JSON.stringify(state)
  );
}

export function clearKitchenSession(
  recipeId: string,
  weekNumber: number
): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(kitchenSessionKey(recipeId, weekNumber));
}
