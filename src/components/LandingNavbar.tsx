"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  navContainerClassName,
  navCtaClassName,
  navGhostButtonClassName,
  navMobileLinkClassName,
  navMobileMenuPanelClassName,
  navMobileMenuToggleClassName,
  navRowClassName,
  navShellClassName,
} from "@/components/navStyles";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingNavbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className={navShellClassName}>
      <div className={navContainerClassName}>
        <div className={navRowClassName}>
          <BrandLogo href="/" size="md" onClick={closeMenu} />

          {/* Desktop: Login + Register only */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className={`${navGhostButtonClassName} px-3 sm:px-4`}
              aria-label="Login to Mise"
            >
              Login
            </Button>
            <Button
              onClick={() => router.push("/register")}
              className={`${navCtaClassName} px-5 lg:px-6 py-2 text-sm lg:text-base`}
              aria-label="Register for Mise"
            >
              Register
            </Button>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {!mobileMenuOpen && (
              <Button
                onClick={() => router.push("/register")}
                size="sm"
                className={`${navCtaClassName} px-3 py-2 text-sm whitespace-nowrap`}
                aria-label="Register for Mise"
              >
                Register
              </Button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={navMobileMenuToggleClassName}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[hsl(var(--paprika))]" />
              ) : (
                <Menu className="w-5 h-5 text-[hsl(var(--paprika))]" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={navMobileMenuPanelClassName}>
            <div className="flex flex-col gap-2 pt-3">
              <Button
                variant="outline"
                onClick={() => {
                  closeMenu();
                  router.push("/login");
                }}
                className={navMobileLinkClassName}
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  closeMenu();
                  router.push("/register");
                }}
                className={`${navCtaClassName} w-full h-11 mt-1 text-base`}
              >
                Register
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
