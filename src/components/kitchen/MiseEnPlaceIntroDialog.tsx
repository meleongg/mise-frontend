"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListChecks } from "lucide-react";

interface MiseEnPlaceIntroDialogProps {
  open: boolean;
  onDismiss: (showIngredients: boolean) => void;
}

export default function MiseEnPlaceIntroDialog({
  open,
  onDismiss,
}: MiseEnPlaceIntroDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss(false);
      }}
    >
      <DialogContent className="bg-white border-2 border-[hsl(var(--paprika))]/30 sm:max-w-md gap-5">
        <DialogHeader className="space-y-4 text-left">
          <div className="flex items-center gap-3">
            <SodieAvatar size="lg" animate="none" className="shrink-0" />
            <div className="min-w-0">
              <DialogTitle className="text-primary">Mise en place</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">
                Gather and prep your ingredients before you start cooking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--paprika))]/20 bg-[hsl(var(--paprika))]/5 px-3 py-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--paprika))]/25 bg-amber-100 text-[hsl(var(--paprika))]"
              aria-hidden
            >
              <ListChecks className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <p className="text-sm text-foreground/85 leading-snug m-0">
              Tap <span className="font-semibold text-primary">Mise</span> in
              the top bar to open your checklist.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            size="touch"
            className="w-full bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
            onClick={() => onDismiss(true)}
          >
            Show ingredients
          </Button>
          <Button
            type="button"
            size="touch"
            variant="outline"
            className="w-full"
            onClick={() => onDismiss(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
