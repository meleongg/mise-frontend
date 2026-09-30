"use client";

import { formatDurationLabel } from "@/lib/kitchenTimers";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
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

  useEffect(() => {
    onChange?.(
      timers
        .filter((t) => !t.done)
        .map(({ id, label, endsAt, totalSeconds }) => ({
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
    setTimers((prev) => [...prev.filter((t) => !t.done), entry].slice(-8));
  }, []);

  const dismissTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => setTimers([]), []);

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
