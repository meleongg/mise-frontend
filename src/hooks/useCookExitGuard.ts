"use client";

import { useEffect, useRef } from "react";

/**
 * Intercept browser back / swipe-back on the cook page and prompt before leaving.
 * Pushes a history entry on mount so the first "back" fires popstate in-app.
 */
export function useCookExitGuard(enabled: boolean, onBackAttempt: () => void) {
  const allowExitRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const pushGuardState = () => {
      window.history.pushState({ kitchenCook: true }, "");
    };

    pushGuardState();

    const onPopState = () => {
      if (allowExitRef.current) return;
      pushGuardState();
      onBackAttempt();
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled, onBackAttempt]);

  const allowExit = () => {
    allowExitRef.current = true;
  };

  return { allowExit };
}
