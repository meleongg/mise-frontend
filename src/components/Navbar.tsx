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
import {
  BarChart3,
  BookHeart,
  Calendar,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  ShoppingBasket,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const primaryLinks = [
  { href: "/weekly-plan", label: "Weekly Plan", Icon: Calendar },
  { href: "/shopping", label: "Shopping", Icon: ShoppingBasket },
  { href: "/my-recipes", label: "My Recipes", Icon: BookHeart },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
];

const accountLinks = [
  { href: "/settings/preferences", label: "Preferences", Icon: Settings },
  { href: "/settings/account", label: "Account", Icon: User },
];

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
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
  };

  const accountActive = accountLinks.some((link) =>
    pathname.startsWith(link.href)
  );

  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

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
              primaryLinks.map((link) => (
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
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  className={`${navDesktopLinkClassName(accountActive)} inline-flex items-center gap-1`}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <User className="h-3.5 w-3.5" />
                  You
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-[hsl(var(--paprika))]/20 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm"
                  >
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          pathname.startsWith(link.href)
                            ? "bg-[hsl(var(--paprika))]/10 font-semibold text-[hsl(var(--paprika))]"
                            : "text-stone-700 hover:bg-amber-50 hover:text-[hsl(var(--paprika))]"
                        }`}
                      >
                        <link.Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-[hsl(var(--paprika))]/15" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={`${navLogoutButtonClassName} flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm`}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
              {primaryLinks.map((link) => (
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
              <p className="px-4 pt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Account
              </p>
              {accountLinks.map((link) => (
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
                onClick={handleLogout}
                className={`${navLogoutButtonClassName} w-full h-11 mt-1`}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
