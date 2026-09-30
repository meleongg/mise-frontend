"use client";

import {
  formatDurationLabel,
  notifyKitchenTimerDone,
} from "@/lib/kitchenTimers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type KitchenTimer = {
  id: string;
  label: string;
  endsAt: number;
  totalSeconds: number;
  done: boolean;
};

export type KitchenTimerSnapshot = {
  id: string;
  label: string;
  endsAt: number;
  totalSeconds: number;
};

type UseKitchenTimersOptions = {
  initial?: KitchenTimerSnapshot[];
  onChange?: (timers: KitchenTimerSnapshot[]) => void;
};

function newId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useKitchenTimers({
  initial = [],
  onChange,
}: UseKitchenTimersOptions = {}) {
  const [now, setNow] = useState(() => Date.now());
  const [timers, setTimers] = useState<KitchenTimer[]>(() =>
    initial.map((t) => ({
      ...t,
      done: t.endsAt <= Date.now(),
    }))
  );
  const announcedDoneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Catch up immediately when returning from lock / background (JS was throttled).
  useEffect(() => {
    const syncNow = () => setNow(Date.now());
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncNow();
    };
    window.addEventListener("focus", syncNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", syncNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    setTimers((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (!t.done && t.endsAt <= now) {
          changed = true;
          return { ...t, done: true };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, [now]);

  // Foreground cue when a timer newly completes (incl. catch-up after unlock).
  useEffect(() => {
    for (const timer of timers) {
      if (!timer.done) continue;
      if (announcedDoneRef.current.has(timer.id)) continue;
      announcedDoneRef.current.add(timer.id);
      notifyKitchenTimerDone(timer.label);
    }
  }, [timers]);

  useEffect(() => {
    // Persist running and recently completed (until dismissed) so unlock/relaunch
    // can still show Done and fire the foreground cue.
    onChange?.(
      timers.map(({ id, label, endsAt, totalSeconds }) => ({
        id,
        label,
        endsAt,
        totalSeconds,
      }))
    );
  }, [timers, onChange]);

  const startTimer = useCallback((totalSeconds: number, label?: string) => {
    const seconds = Math.max(1, Math.floor(totalSeconds));
    const entry: KitchenTimer = {
      id: newId(),
      label: (label || formatDurationLabel(seconds)).slice(0, 80),
      endsAt: Date.now() + seconds * 1000,
      totalSeconds: seconds,
      done: false,
    };
    setTimers((prev) => [...prev, entry].slice(-8));
  }, []);

  const dismissTimer = useCallback((id: string) => {
    announcedDoneRef.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    announcedDoneRef.current.clear();
    setTimers([]);
  }, []);

  const live = useMemo(
    () =>
      timers.map((t) => ({
        ...t,
        remainingSeconds: Math.max(0, Math.ceil((t.endsAt - now) / 1000)),
      })),
    [timers, now]
  );

  const activeForSodie = useMemo(
    () =>
      live
        .filter((t) => !t.done)
        .map((t) => ({
          label: t.label,
          remaining_seconds: t.remainingSeconds,
        })),
    [live]
  );

  return {
    timers: live,
    activeForSodie,
    startTimer,
    dismissTimer,
    clearAll,
  };
}
