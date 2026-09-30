"use client";

import {
  clearKitchenSession,
  KitchenSessionState,
  loadKitchenSession,
  saveKitchenSession,
} from "@/lib/kitchenSessionStorage";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseKitchenSessionOptions {
  recipeId: string;
  weekNumber: number;
  stepCount: number;
}

export function useKitchenSession({
  recipeId,
  weekNumber,
  stepCount,
}: UseKitchenSessionOptions) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  );
  const [showIngredients, setShowIngredients] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const saved = loadKitchenSession(recipeId, weekNumber);
    if (saved) {
      setCurrentStepIndex(
        Math.min(
          Math.max(0, saved.currentStepIndex),
          Math.max(0, stepCount - 1)
        )
      );
      setCheckedIngredients(new Set(saved.checkedIngredients));
    }
    setHydrated(true);
  }, [recipeId, weekNumber, stepCount]);

  const persist = useCallback(
    (stepIndex: number, checked: Set<number>) => {
      const existing = loadKitchenSession(recipeId, weekNumber);
      const state: KitchenSessionState = {
        currentStepIndex: stepIndex,
        checkedIngredients: Array.from(checked),
        timers: existing?.timers,
      };
      saveKitchenSession(recipeId, weekNumber, state);
    },
    [recipeId, weekNumber]
  );

  useEffect(() => {
    if (!hydrated || stepCount === 0) return;
    persist(currentStepIndex, checkedIngredients);
  }, [currentStepIndex, checkedIngredients, hydrated, persist, stepCount]);

  useEffect(() => {
    let cancelled = false;

    async function requestWakeLock() {
      if (!("wakeLock" in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current?.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Progressive enhancement — unsupported or denied
      }
    }

    if (hydrated) {
      requestWakeLock();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [hydrated, recipeId, weekNumber]);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(
      Math.min(Math.max(0, index), Math.max(0, stepCount - 1))
    );
  };

  const clearSession = useCallback(() => {
    clearKitchenSession(recipeId, weekNumber);
  }, [recipeId, weekNumber]);

  return {
    hydrated,
    currentStepIndex,
    checkedIngredients,
    showIngredients,
    setShowIngredients,
    toggleIngredient,
    goToStep,
    setCurrentStepIndex: goToStep,
    clearSession,
    isFirstStep: currentStepIndex === 0,
    isLastStep: stepCount > 0 && currentStepIndex === stepCount - 1,
  };
}
