/**
 * Client-side mirror of the backend password policy
 * (see backend/app/schemas/__init__.py).
 *
 * Keep these rules in sync with the server. Validation is duplicated on the
 * client purely for UX (live feedback); the server remains the source of truth.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRuleId = "length" | "letter" | "digit" | "noWhitespaceEnds";

export interface PasswordRule {
  id: PasswordRuleId;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`,
    test: (v) =>
      v.length >= PASSWORD_MIN_LENGTH && v.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: "letter",
    label: "Contains a letter",
    test: (v) => /\p{L}/u.test(v),
  },
  {
    id: "digit",
    label: "Contains a number",
    test: (v) => /\d/.test(v),
  },
  {
    id: "noWhitespaceEnds",
    label: "No leading or trailing spaces",
    test: (v) => v.length === 0 || v === v.trim(),
  },
];

export function evaluatePassword(value: string): {
  results: Record<PasswordRuleId, boolean>;
  isValid: boolean;
} {
  const results = {} as Record<PasswordRuleId, boolean>;
  for (const rule of PASSWORD_RULES) {
    results[rule.id] = rule.test(value);
  }
  const isValid =
    PASSWORD_RULES.every((r) => results[r.id]) && value.length > 0;
  return { results, isValid };
}
