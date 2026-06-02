"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type SodieSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type SodieAnimate = "none" | "idle" | "celebrate";

const SIZE_PX: Record<SodieSize, number> = {
  xs: 24,
  sm: 40,
  md: 64,
  lg: 96,
  xl: 120,
  "2xl": 168,
};

const ANIMATE_CLASS: Record<SodieAnimate, string> = {
  none: "",
  idle: "motion-safe:animate-simmer",
  celebrate: "motion-safe:animate-sizzle",
};

interface SodieAvatarProps {
  size?: SodieSize;
  animate?: SodieAnimate;
  className?: string;
  alt?: string;
}

export default function SodieAvatar({
  size = "md",
  animate = "none",
  className = "",
  alt = "Sodie, your culinary companion",
}: SodieAvatarProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const px = SIZE_PX[size];
  const motionClass =
    reducedMotion || animate === "none" ? "" : ANIMATE_CLASS[animate];

  return (
    <Image
      src="/brand/sodie.svg"
      alt={alt}
      width={px}
      height={px}
      className={`shrink-0 object-contain ${motionClass} ${className}`}
    />
  );
}
