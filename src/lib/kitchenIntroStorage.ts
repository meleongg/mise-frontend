const MISE_INTRO_KEY = "chefpath-kitchen-mise-intro-dismissed";

export function hasSeenMiseIntro(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MISE_INTRO_KEY) === "1";
  } catch {
    return true;
  }
}

export function markMiseIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MISE_INTRO_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}
