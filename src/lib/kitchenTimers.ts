/** Parse and format kitchen countdown helpers (client-only). */

export type KitchenTimerSuggestion = {
  label: string;
  totalSeconds: number;
};

const DURATION_RE =
  /\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|min|m|seconds?|secs?|s)\b/gi;

function unitToSeconds(amount: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (/^h(ours?)?$|^hrs?$/.test(u)) return Math.round(amount * 3600);
  if (/^m(in(ute)?s?)?$/.test(u)) return Math.round(amount * 60);
  if (/^s(ec(ond)?s?)?$/.test(u)) return Math.round(amount);
  return null;
}

/** Extract unique duration suggestions from a step instruction. */
export function parseStepDurationSuggestions(
  text: string,
  limit = 3
): KitchenTimerSuggestion[] {
  if (!text.trim()) return [];
  const seen = new Set<number>();
  const out: KitchenTimerSuggestion[] = [];
  for (const match of text.matchAll(DURATION_RE)) {
    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const seconds = unitToSeconds(amount, match[2]);
    if (seconds == null || seconds <= 0 || seconds > 24 * 60 * 60) continue;
    if (seen.has(seconds)) continue;
    seen.add(seconds);
    out.push({
      label: formatDurationLabel(seconds),
      totalSeconds: seconds,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export function formatDurationLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s} sec`;
  if (s % 3600 === 0) {
    const h = s / 3600;
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  if (s % 60 === 0) {
    const m = s / 60;
    return m === 1 ? "1 min" : `${m} min`;
  }
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem.toString().padStart(2, "0")}s`;
}

export function formatCountdown(remainingSeconds: number): string {
  const s = Math.max(0, Math.floor(remainingSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export const KITCHEN_TIMER_PRESETS: KitchenTimerSuggestion[] = [
  { label: "1 min", totalSeconds: 60 },
  { label: "5 min", totalSeconds: 300 },
  { label: "10 min", totalSeconds: 600 },
];
