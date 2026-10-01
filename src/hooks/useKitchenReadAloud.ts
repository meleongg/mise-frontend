"use client";

import { useCallback, useEffect, useState } from "react";

export type KitchenReadAloudState = {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  toggle: (text: string) => void;
};

/**
 * On-device step read-aloud via Web Speech API (no server audio).
 */
export function useKitchenReadAloud(): KitchenReadAloudState {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof window.speechSynthesis !== "undefined" &&
        typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const cleaned = text.trim();
      if (!cleaned || typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.95;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const toggle = useCallback(
    (text: string) => {
      if (speaking) {
        stop();
        return;
      }
      speak(text);
    },
    [speak, speaking, stop]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { supported, speaking, speak, stop, toggle };
}
