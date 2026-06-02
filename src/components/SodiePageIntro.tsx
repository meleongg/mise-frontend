"use client";

import SodieAvatar from "@/components/SodieAvatar";

type SodiePageIntroProps = {
  title: string;
  description: string;
};

export default function SodiePageIntro({
  title,
  description,
}: SodiePageIntroProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
      <SodieAvatar
        size="xl"
        animate="idle"
        className="shrink-0 drop-shadow-md sm:hidden"
      />
      <SodieAvatar
        size="2xl"
        animate="idle"
        className="shrink-0 drop-shadow-md hidden sm:block"
      />
      <div className="min-w-0">
        <h1 className="font-heading font-bold text-3xl text-[#262218]">
          {title}
        </h1>
        <p className="font-body text-muted-foreground mt-2">{description}</p>
      </div>
    </div>
  );
}
