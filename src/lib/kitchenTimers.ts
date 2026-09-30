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

/**
 * Foreground-only completion cue. Works while Kitchen Mode is open/visible;
 * does not wake a locked phone (no push / service worker).
 */
export function notifyKitchenTimerDone(_label?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([180, 80, 180]);
    }
  } catch {
    /* unsupported or blocked */
  }

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    gain.connect(ctx.destination);

    const freqs = [880, 1174];
    for (const [index, freq] of freqs.entries()) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      const start = now + index * 0.12;
      osc.start(start);
      osc.stop(start + 0.28);
    }

    window.setTimeout(() => {
      void ctx.close();
    }, 800);
  } catch {
    /* autoplay / AudioContext blocked until gesture — vibration may still run */
  }
}
