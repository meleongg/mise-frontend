/** Client-side servings parse/scale helpers (mirrors backend servings.py). */

export type ServingsInput = string | number | null | undefined;

const FRACTION_RE = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/;
const ABOUT_PREFIX_RE = /^\s*(?:about|approx\.?|approximately)\s+/i;
const SERVES_PREFIX_RE = /^\s*serves?\s+/i;
const LEADING_NUMBER_RE =
  /^\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*(?:servings?|people|persons?|ppl)?\s*$/i;
const RANGE_RE = /\d+\s*-\s*\d+/;

function stripSoftNoise(raw: string): string {
  let s = raw.replace(ABOUT_PREFIX_RE, "").trim();
  s = s.replace(SERVES_PREFIX_RE, "").trim();
  return s || raw;
}

function parseNumberToken(token: string): number | null {
  const cleaned = token.replace(/\s+/g, "");
  if (cleaned.includes("/")) {
    const [a, b] = cleaned.split("/", 2);
    const num = Number(a);
    const den = Number(b);
    if (!den || Number.isNaN(num) || Number.isNaN(den)) return null;
    return num / den;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseServings(value?: ServingsInput): number | null {
  if (value == null) return null;
  if (typeof value === "boolean") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (raw.includes("+") || RANGE_RE.test(raw) || lowered.includes("family")) {
    return null;
  }

  const frac = raw.match(FRACTION_RE);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (!den) return null;
    const n = num / den;
    return n > 0 ? n : null;
  }

  const match = stripSoftNoise(raw).match(LEADING_NUMBER_RE);
  if (!match) return null;
  const n = parseNumberToken(match[1]);
  return n != null && n > 0 ? n : null;
}

export function scaleFactor(
  selected?: ServingsInput,
  baseline?: ServingsInput
): { factor: number; needsReview: boolean; reason: string | null } {
  const selectedN = parseServings(selected);
  const baselineN = parseServings(baseline);
  if (selectedN != null && baselineN != null && baselineN !== 0) {
    return { factor: selectedN / baselineN, needsReview: false, reason: null };
  }
  const selectedPresent =
    selected != null && String(selected).trim() !== "";
  const baselinePresent =
    baseline != null && String(baseline).trim() !== "";
  if (
    (selectedPresent && selectedN == null) ||
    (baselinePresent && baselineN == null)
  ) {
    return {
      factor: 1,
      needsReview: true,
      reason: "servings not scaled; unparseable selected or baseline",
    };
  }
  return { factor: 1, needsReview: false, reason: null };
}

export function formatServingsAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

export function formatServingsLabel(n?: ServingsInput): string {
  const parsed = parseServings(n);
  if (parsed == null) return "";
  const amount = formatServingsAmount(parsed);
  return amount ? `${amount} servings` : "";
}

export function formatScaleFactor(factor: number): string {
  const rounded = Math.round(factor * 100) / 100;
  if (rounded === 0.5) return "½×";
  if (rounded === 1) return "1×";
  if (rounded === 1.5) return "1½×";
  if (rounded === 2) return "2×";
  if (Number.isInteger(rounded)) return `${rounded}×`;
  return `${rounded}×`;
}

export const SCALE_PRESETS = [0.5, 1, 1.5, 2] as const;
