"use client";

import IngredientChecklist from "@/components/kitchen/IngredientChecklist";
import KitchenModeShell from "@/components/kitchen/KitchenModeShell";
import MiseEnPlaceIntroDialog from "@/components/kitchen/MiseEnPlaceIntroDialog";
import StepNavigator from "@/components/kitchen/StepNavigator";
import BackNavButton from "@/components/BackNavButton";
import RecipeFeedbackForm from "@/components/RecipeFeedbackForm";
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
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import {
  useRecipeQuery,
  useToggleRecipeStatusMutation,
  useWeeklyRecipeProgressQuery,
} from "@/hooks/queries";
import { useCookExitGuard } from "@/hooks/useCookExitGuard";
import { useKitchenSession } from "@/hooks/useKitchenSession";
import { parseHelpers } from "@/lib/api";
import { hasSeenMiseIntro, markMiseIntroSeen } from "@/lib/kitchenIntroStorage";
import { resolveRecipeWeek } from "@/lib/recipeWeek";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";

type CookPhase = "cooking" | "feedback";

export default function KitchenCookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { state } = useApp();
  const weekNumber = resolveRecipeWeek(searchParams, state.currentWeek);
  const recipeId = resolvedParams.id;

  const isPreview = searchParams.get("preview") === "1";
  const isCommit =
    searchParams.get("commit") === "1" ||
    (!isPreview && searchParams.get("preview") !== "1");

  const [phase, setPhase] = useState<CookPhase>("cooking");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCommitIntro, setShowCommitIntro] = useState(false);
  const [showMiseIntro, setShowMiseIntro] = useState(false);
  const updateStatusMutation = useToggleRecipeStatusMutation();

  const { data: recipe, isLoading } = useRecipeQuery(recipeId);
  const { data: recipeProgress, isSuccess: progressLoaded } =
    useWeeklyRecipeProgressQuery(user?.id, weekNumber);

  const handleBackAttempt = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const { allowExit } = useCookExitGuard(
    phase === "cooking",
    handleBackAttempt
  );

  const ingredients = recipe
    ? parseHelpers.parseRecipeIngredients(recipe.ingredients)
    : [];
  const steps = recipe
    ? parseHelpers.parseRecipeInstructionsStructured(recipe.instructions)
    : [];

  const session = useKitchenSession({
    recipeId,
    weekNumber,
    stepCount: steps.length,
  });

  const progressEntry = recipeProgress?.find((p) => p.recipe_id === recipeId);
  const existingFeedback = progressEntry?.feedback
    ? {
        feedback: progressEntry.feedback,
        notes: progressEntry.notes,
      }
    : undefined;

  const progressStatus = progressEntry?.status;
  const recipeHref = `/recipe/${recipeId}?week=${weekNumber}`;

  const needsCommitIntro = useMemo(
    () =>
      isCommit &&
      !isPreview &&
      progressLoaded &&
      progressStatus !== "in_progress" &&
      progressStatus !== "completed",
    [isCommit, isPreview, progressLoaded, progressStatus]
  );

  useEffect(() => {
    if (!progressLoaded) return;
    setShowCommitIntro(needsCommitIntro);
  }, [needsCommitIntro, progressLoaded]);

  useEffect(() => {
    if (!session.hydrated || showCommitIntro || phase !== "cooking") return;
    if (!hasSeenMiseIntro()) {
      setShowMiseIntro(true);
    }
  }, [session.hydrated, showCommitIntro, phase]);

  useEffect(() => {
    if (!user?.id || !progressLoaded) return;
    if (progressStatus === "completed") {
      router.replace(recipeHref);
    }
  }, [user?.id, progressLoaded, progressStatus, router, recipeHref]);

  const markInProgress = useCallback(() => {
    if (isPreview || !user?.id) return;
    if (progressStatus === "in_progress" || progressStatus === "completed") {
      return;
    }
    updateStatusMutation.mutate({
      userId: user.id,
      recipeId,
      weekNumber,
      request: { status: "in_progress" },
    });
  }, [
    isPreview,
    user?.id,
    progressStatus,
    recipeId,
    weekNumber,
    updateStatusMutation,
  ]);

  const startCommittedCooking = () => {
    markInProgress();
    setShowCommitIntro(false);
  };

  const navigateAway = () => {
    setShowExitDialog(false);
    allowExit();
    router.push(recipeHref);
  };

  const handlePauseAndExit = () => {
    if (!isPreview) {
      markInProgress();
    }
    navigateAway();
  };

  const handleLeaveWithoutSaving = async () => {
    if (user?.id && !isPreview) {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        recipeId,
        weekNumber,
        request: { status: "not_started" },
      });
    }
    session.clearSession();
    navigateAway();
  };

  const handleStepNext = () => {
    if (!isPreview) markInProgress();
    session.goToStep(session.currentStepIndex + 1);
  };

  const handleSkipFeedback = async () => {
    if (!user?.id) return;
    await updateStatusMutation.mutateAsync({
      userId: user.id,
      recipeId,
      weekNumber,
      request: { status: "completed" },
    });
  };

  const handleBackFromFeedback = () => {
    router.push(recipeHref);
  };

  if (isLoading || !recipe || !session.hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-[hsl(var(--turmeric))]/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--paprika))]" />
      </div>
    );
  }

  if (phase === "feedback") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-[hsl(var(--turmeric))]/30 px-4 py-8 overflow-visible">
        <div className="max-w-lg mx-auto overflow-visible">
          <RecipeFeedbackForm
            variant="inline"
            recipeId={recipeId}
            weekNumber={weekNumber}
            existingFeedback={existingFeedback}
            onFeedbackSubmitted={() => {
              session.clearSession();
              router.push("/weekly-plan");
            }}
            onSkip={handleSkipFeedback}
            onBack={handleBackFromFeedback}
          />
        </div>
      </div>
    );
  }

  if (showCommitIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-[hsl(var(--turmeric))]/30 px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <SodieAvatar size="xl" animate="none" className="mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-primary">{recipe.name}</h1>
            <p className="text-muted-foreground mt-2">
              Ready when you are — I&apos;ll walk you through each step. Use the{" "}
              <span className="font-medium text-primary">Mise</span> checklist
              in the top bar to prep ingredients first.
            </p>
          </div>
          <Button
            type="button"
            size="touch"
            className="w-full text-lg font-semibold bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
            onClick={startCommittedCooking}
          >
            Let&apos;s cook
          </Button>
          <BackNavButton
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              allowExit();
              router.push(recipeHref);
            }}
          >
            Back to recipe
          </BackNavButton>
        </div>
      </div>
    );
  }

  const stepLabel =
    steps.length > 0
      ? `Step ${session.currentStepIndex + 1} of ${steps.length}`
      : "Kitchen mode";

  const exitDescription = isPreview
    ? "You're browsing steps only — nothing is saved to your weekly plan yet."
    : "Your step progress is saved locally. Choose how you'd like to leave.";

  const closeMiseIntro = (openIngredients: boolean) => {
    markMiseIntroSeen();
    setShowMiseIntro(false);
    if (openIngredients) session.setShowIngredients(true);
  };

  return (
    <>
      <MiseEnPlaceIntroDialog open={showMiseIntro} onDismiss={closeMiseIntro} />

      <KitchenModeShell
        recipeName={recipe.name}
        stepLabel={stepLabel}
        isPreview={isPreview}
        showIngredients={session.showIngredients}
        onToggleIngredients={() =>
          session.setShowIngredients(!session.showIngredients)
        }
        onExit={() => setShowExitDialog(true)}
        ingredientsPanel={
          <IngredientChecklist
            ingredients={ingredients}
            checkedIndices={session.checkedIngredients}
            onToggle={session.toggleIngredient}
          />
        }
      >
        <StepNavigator
          steps={steps}
          currentIndex={session.currentStepIndex}
          onPrevious={() => session.goToStep(session.currentStepIndex - 1)}
          onNext={handleStepNext}
          onFinish={() => {
            if (isPreview) {
              allowExit();
              router.push(recipeHref);
              return;
            }
            markInProgress();
            setPhase("feedback");
          }}
        />
      </KitchenModeShell>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent
          showCloseButton={false}
          className="bg-white border-2 border-[hsl(var(--paprika))]/30 sm:max-w-md"
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              <SodieAvatar size="lg" animate="none" className="shrink-0" />
              <div>
                <DialogTitle className="text-primary">
                  Leaving kitchen mode?
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {exitDescription}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full bg-[hsl(var(--paprika))] hover:bg-[hsl(var(--primary))]/90 text-white"
              onClick={() => setShowExitDialog(false)}
            >
              Keep cooking
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handlePauseAndExit}
            >
              Pause & come back
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleLeaveWithoutSaving}
            >
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
