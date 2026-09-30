const STORAGE_PREFIX = "chefpath-kitchen";
/** Drop stale cook sessions after a day (localStorage survives PWA relaunch). */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

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
  /** Wall-clock ms when this session was last written. */
  updatedAt?: number;
}

type StoredKitchenSession = KitchenSessionState & { updatedAt: number };

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
  try {
    // Keep sessionStorage in sync for same-tab callers mid-migration.
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function removeRaw(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadKitchenSession(
  recipeId: string,
  weekNumber: number
): KitchenSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const key = kitchenSessionKey(recipeId, weekNumber);
    const raw = readRaw(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredKitchenSession;
    const updatedAt = Number(parsed.updatedAt || 0);
    if (updatedAt && Date.now() - updatedAt > SESSION_TTL_MS) {
      removeRaw(key);
      return null;
    }
    return parsed;
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
  const payload: StoredKitchenSession = {
    ...state,
    updatedAt: Date.now(),
  };
  writeRaw(kitchenSessionKey(recipeId, weekNumber), JSON.stringify(payload));
}

export function clearKitchenSession(
  recipeId: string,
  weekNumber: number
): void {
  removeRaw(kitchenSessionKey(recipeId, weekNumber));
}
