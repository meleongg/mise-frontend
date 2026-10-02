"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/20 bg-background/80 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <BrandLogo href="/" size="sm" />
          <nav
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm"
            aria-label="Legal"
          >
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-[hsl(var(--paprika))] underline-offset-2 hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-[hsl(var(--paprika))] underline-offset-2 hover:underline"
            >
              Terms
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground font-body">
            © {currentYear} Mise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
