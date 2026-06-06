"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export type SodieSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type SodieAnimate = "none" | "idle" | "celebrate" | "thinking";

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
  idle: "animate-simmer",
  celebrate: "animate-sodie-celebrate",
  thinking: "animate-sodie-shake",
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
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className
      )}
      style={motionClass ? { transformOrigin: "50% 92%" } : undefined}
    >
      <Image
        src="/brand/sodie.svg"
        alt={alt}
        width={px}
        height={px}
        className={cn("object-contain", motionClass)}
      />
    </span>
  );
}
