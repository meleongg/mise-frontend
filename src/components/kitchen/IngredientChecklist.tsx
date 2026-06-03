"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface IngredientChecklistProps {
  ingredients: string[];
  checkedIndices: Set<number>;
  onToggle: (index: number) => void;
}

export default function IngredientChecklist({
  ingredients,
  checkedIndices,
  onToggle,
}: IngredientChecklistProps) {
  const total = ingredients.length;
  const checkedCount = checkedIndices.size;

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-primary">
            {checkedCount} of {total} prepped
          </span>
          <span className="text-muted-foreground text-xs">
            Tap each line when ready
          </span>
        </div>
      )}
      {total > 0 && (
        <div
          className="h-1.5 w-full rounded-full bg-[hsl(var(--paprika))]/15 overflow-hidden"
          role="progressbar"
          aria-valuenow={checkedCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Ingredients prepped"
        >
          <div
            className="h-full rounded-full bg-[hsl(var(--paprika))] transition-all duration-300"
            style={{
              width: `${total ? (checkedCount / total) * 100 : 0}%`,
            }}
          />
        </div>
      )}
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => {
          const checked = checkedIndices.has(index);
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => onToggle(index)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors",
                  checked
                    ? "border-green-500/50 bg-green-50/80 text-muted-foreground"
                    : "border-[hsl(var(--paprika))]/30 bg-white hover:border-[hsl(var(--paprika))]/50"
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5",
                    checked
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-[hsl(var(--paprika))]/40"
                  )}
                >
                  {checked && <Check className="w-4 h-4" />}
                </span>
                <span className={cn("flex-1", checked && "line-through")}>
                  {ingredient}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
