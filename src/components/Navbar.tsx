"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  navContainerClassName,
  navDesktopLinkClassName,
  navLogoutButtonClassName,
  navMobileMenuPanelClassName,
  navMobileMenuToggleClassName,
  navMobileNavLinkClassName,
  navRowClassName,
  navShellClassName,
} from "@/components/navStyles";
import { Button } from "@/components/ui/button";
import { actions, useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Calendar, Menu, Settings, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar({
  showMinimal = false,
}: {
  showMinimal?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dispatch } = useApp();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { href: "/weekly-plan", label: "Weekly Plan", Icon: Calendar },
    { href: "/analytics", label: "Analytics", Icon: BarChart3 },
    { href: "/settings/preferences", label: "Preferences", Icon: Settings },
    { href: "/settings/account", label: "Account", Icon: User },
  ];

  const handleLogout = async () => {
    closeMenu();
    await logout();
    dispatch(actions.resetState());
    router.push("/");
  };

  return (
    <nav className={navShellClassName}>
      <div className={navContainerClassName}>
        <div className={navRowClassName}>
          <BrandLogo href="/weekly-plan" size="md" onClick={closeMenu} />

          {/* Desktop */}
          <div className="hidden md:flex gap-1 lg:gap-2 items-center shrink-0">
            {!showMinimal &&
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navDesktopLinkClassName(
                    pathname.startsWith(link.href)
                  )}
                >
                  {link.label}
                </Link>
              ))}
            {!showMinimal && (
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className={navLogoutButtonClassName}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          {!showMinimal && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`md:hidden ${navMobileMenuToggleClassName}`}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[hsl(var(--paprika))]" />
              ) : (
                <Menu className="w-5 h-5 text-[hsl(var(--paprika))]" />
              )}
            </button>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && !showMinimal && (
          <div className={navMobileMenuPanelClassName}>
            <div className="flex flex-col gap-2 pt-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={navMobileNavLinkClassName(
                    pathname.startsWith(link.href)
                  )}
                >
                  <link.Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <Button
                variant="outline"
                onClick={handleLogout}
                className={`${navLogoutButtonClassName} w-full h-11 mt-1`}
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
