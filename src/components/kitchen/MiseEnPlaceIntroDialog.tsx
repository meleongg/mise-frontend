"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="bg-white border-2 border-[hsl(var(--paprika))]/30 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <SodieAvatar size="lg" animate="idle" className="shrink-0" />
            <div>
              <DialogTitle className="text-primary">Mise en place</DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 space-y-3 text-muted-foreground text-sm">
                  <p>
                    Before you dive into steps, gather and prep your ingredients
                    — that&apos;s{" "}
                    <span className="font-medium text-primary">
                      mise en place
                    </span>
                    .
                  </p>
                  <div className="flex items-center gap-3 text-foreground/80">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--paprika))]/25 bg-amber-100 text-[hsl(var(--paprika))]"
                      aria-hidden
                    >
                      <ListChecks className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <p className="text-sm leading-snug m-0">
                      Tap <span className="font-medium">Mise</span> in the top
                      bar anytime to open your checklist and check items off as
                      you prep.
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
            onClick={() => onDismiss(true)}
          >
            Show ingredients
          </Button>
          <Button
            type="button"
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
