"use client";

import { Check, Circle } from "lucide-react";
import {
  evaluatePassword,
  PASSWORD_RULES,
  type PasswordRuleId,
} from "@/lib/passwordPolicy";

interface PasswordRequirementsProps {
  value: string;
  className?: string;
}

/**
 * Live checklist of password requirements. Rules ticked green as they pass.
 * Intentionally minimal — no input handling, just a presentation layer driven
 * by the parent's controlled state.
 */
export default function PasswordRequirements({
  value,
  className = "",
}: PasswordRequirementsProps) {
  const { results } = evaluatePassword(value);

  return (
    <ul
      className={`mt-2 space-y-1 text-xs ${className}`}
      aria-label="Password requirements"
    >
      {PASSWORD_RULES.map((rule) => {
        const passed = results[rule.id as PasswordRuleId];
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 transition-colors ${
              passed ? "text-[hsl(var(--sage))]" : "text-muted-foreground"
            }`}
          >
            {passed ? (
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
