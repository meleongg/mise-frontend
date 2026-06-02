"use client";

import BrandLogo from "@/components/BrandLogo";

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/20 bg-background/80 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <BrandLogo href="/" size="sm" />
          <p className="text-sm text-muted-foreground font-body">
            © {currentYear} Mise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
