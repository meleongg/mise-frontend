"use client";

import SodieAvatar from "@/components/SodieAvatar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Extra content under the description (e.g. subtle meta). */
  children?: ReactNode;
};

/**
 * Compact protected-page chrome: small Sodie mark + title + one-line subtitle.
 * Matches Shopping / My Recipes density with character colour.
 */
export default function PageHeader({
  title,
  description,
  action,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-orange-50 to-amber-100 p-0.5">
          <SodieAvatar size="sm" animate="none" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
          {description ? (
            <p className="text-sm text-stone-600">{description}</p>
          ) : null}
          {children}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
