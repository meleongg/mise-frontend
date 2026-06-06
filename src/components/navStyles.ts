/** Shared Warm Kitchen nav styling for landing + app navbars */

export const navShellClassName =
  "sticky top-0 z-50 w-full border-b border-[hsl(var(--paprika))]/20 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100/80 backdrop-blur-md shadow-sm";

export const navContainerClassName = "container mx-auto px-4 sm:px-6";

export const navRowClassName =
  "flex items-center justify-between gap-3 py-3 sm:py-4";

export const navLogoLinkClassName =
  "flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-90 transition-opacity";

export const navLogoIconBoxClassName =
  "shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center shadow-warm";

export const navLogoIconClassName =
  "w-5 h-5 sm:w-6 sm:h-6 text-[hsl(var(--paprika))]";

export const navBrandTextClassName =
  "font-heading font-black text-xl sm:text-2xl text-[#262218] truncate tracking-tight";

export const navMobileMenuPanelClassName =
  "md:hidden border-t border-[hsl(var(--paprika))]/15 bg-gradient-to-b from-amber-100/90 via-orange-50/80 to-amber-50/90 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6";

export const navMobileMenuToggleClassName =
  "p-2 rounded-lg bg-white/40 hover:bg-white/60 border border-[hsl(var(--paprika))]/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--paprika))]/40";

export const navCtaClassName =
  "bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white font-bold shadow-md hover:shadow-lg ring-1 ring-[hsl(var(--paprika))]/25 transition-all duration-300";

export const navGhostButtonClassName =
  "text-[hsl(var(--paprika))] bg-white/80 hover:bg-white border border-[hsl(var(--paprika))]/25 hover:border-[hsl(var(--paprika))]/45 shadow-sm";

export const navMobileLinkClassName =
  "w-full justify-start h-11 px-4 text-base font-semibold text-[hsl(var(--paprika))] bg-white/80 hover:bg-white rounded-lg border border-[hsl(var(--paprika))]/25 hover:border-[hsl(var(--paprika))]/45 shadow-sm";

export function navDesktopLinkClassName(isActive: boolean): string {
  return `text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
    isActive
      ? "bg-[hsl(var(--paprika))]/10 text-[hsl(var(--paprika))] font-semibold"
      : "text-gray-700 hover:bg-white/50 hover:text-[hsl(var(--paprika))]"
  }`;
}

export function navMobileNavLinkClassName(isActive: boolean): string {
  return `flex items-center gap-2 w-full text-left px-4 h-11 rounded-lg transition-all duration-200 ${
    isActive
      ? "bg-[hsl(var(--paprika))]/10 text-[hsl(var(--paprika))] font-semibold"
      : "text-gray-700 hover:bg-white/50 hover:text-[hsl(var(--paprika))]"
  }`;
}

export const navLogoutButtonClassName =
  "border-2 border-[hsl(var(--paprika))]/40 text-[hsl(var(--paprika))] hover:bg-[hsl(var(--paprika))] hover:text-white hover:border-[hsl(var(--paprika))] transition-all duration-200 font-semibold";
