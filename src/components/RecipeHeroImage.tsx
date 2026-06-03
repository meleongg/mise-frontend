"use client";

import { isPexelsImageUrl } from "@/lib/recipeImage";
import { cn } from "@/lib/utils";
import Image from "next/image";

type RecipeHeroImageProps = {
  src: string;
  alt: string;
  variant?: "detail" | "card";
  className?: string;
  showPexelsCredit?: boolean;
};

export default function RecipeHeroImage({
  src,
  alt,
  variant = "detail",
  className,
  showPexelsCredit = variant === "detail",
}: RecipeHeroImageProps) {
  const isCard = variant === "card";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-stone-200/80",
          isCard
            ? "aspect-[4/3] rounded-t-[inherit] transition-transform duration-500 group-hover:scale-[1.03]"
            : "aspect-[16/10] max-h-[min(22rem,56vw)] md:max-h-[26rem] rounded-lg shadow-md"
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={
            isCard
              ? "(max-width: 768px) 100vw, 50vw"
              : "(max-width: 896px) 100vw, 896px"
          }
          className="object-cover object-center"
          priority={!isCard}
        />
      </div>
      {showPexelsCredit && isPexelsImageUrl(src) && (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            isCard ? "px-3 py-1.5 bg-white/90" : "text-right mt-1.5"
          )}
        >
          Photo via{" "}
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Pexels
          </a>
        </p>
      )}
    </div>
  );
}
