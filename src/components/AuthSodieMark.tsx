"use client";

import SodieAvatar from "@/components/SodieAvatar";

/** Compact Sodie badge for login / register card headers. */
export default function AuthSodieMark() {
  return (
    <div className="mx-auto inline-flex items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[hsl(var(--paprika))]/15 to-[hsl(var(--turmeric))]/20 p-3 sm:p-3.5 shadow-sm">
      <SodieAvatar
        size="md"
        animate="none"
        className="drop-shadow-sm sm:hidden"
      />
      <SodieAvatar
        size="lg"
        animate="none"
        className="drop-shadow-md hidden sm:block"
      />
    </div>
  );
}
