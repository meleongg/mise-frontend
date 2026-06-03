"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

type BackNavButtonProps = {
  children: React.ReactNode;
  className?: string;
} & Pick<
  ComponentProps<typeof Button>,
  "variant" | "size" | "disabled" | "type"
> &
  (
    | { href: string; onClick?: never }
    | { href?: undefined; onClick?: () => void }
  );

export default function BackNavButton({
  children,
  href,
  onClick,
  className,
  variant = "secondary",
  size,
  disabled,
  type = "button",
}: BackNavButtonProps) {
  const content = (
    <span className="inline-flex items-center gap-1.5">
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
      {children}
    </span>
  );

  if (href) {
    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={disabled}
      >
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(className)}
      disabled={disabled}
    >
      {content}
    </Button>
  );
}
