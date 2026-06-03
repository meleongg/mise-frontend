"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListChecks, X } from "lucide-react";
import { ReactNode } from "react";

interface KitchenModeShellProps {
  recipeName: string;
  stepLabel: string;
  isPreview?: boolean;
  showIngredients: boolean;
  onToggleIngredients: () => void;
  onExit: () => void;
  ingredientsPanel?: ReactNode;
  children: ReactNode;
}

export default function KitchenModeShell({
  recipeName,
  stepLabel,
  isPreview = false,
  showIngredients,
  onToggleIngredients,
  onExit,
  ingredientsPanel,
  children,
}: KitchenModeShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-[hsl(var(--turmeric))]/30">
      <header className="sticky top-0 z-20 border-b border-[hsl(var(--paprika))]/20 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <SodieAvatar size="md" animate="none" className="shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-primary truncate text-lg">
                {recipeName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isPreview ? "Preview · " : ""}
                {stepLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onToggleIngredients}
              className={cn(
                "h-10 gap-1.5 px-2.5",
                showIngredients && "bg-amber-100 text-[hsl(var(--paprika))]"
              )}
              aria-label={
                showIngredients
                  ? "Hide mise en place checklist"
                  : "Show mise en place checklist"
              }
              aria-expanded={showIngredients}
            >
              <ListChecks className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold hidden min-[380px]:inline">
                Mise
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onExit}
              className="h-10 w-10"
              aria-label="Exit kitchen mode"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {showIngredients && ingredientsPanel && (
        <div className="border-b border-[hsl(var(--paprika))]/20 bg-white/95 px-4 py-4 max-h-[45vh] overflow-y-auto shadow-sm">
          <div className="max-w-lg mx-auto rounded-xl border border-[hsl(var(--paprika))]/15 bg-gradient-to-b from-amber-50/80 to-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--paprika))]/15 text-[hsl(var(--paprika))]">
                <ListChecks className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-primary leading-tight">
                  Mise en place
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gather & prep before you cook
                </p>
              </div>
            </div>
            {ingredientsPanel}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
