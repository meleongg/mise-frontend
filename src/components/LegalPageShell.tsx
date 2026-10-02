import LandingFooter from "@/components/LandingFooter";
import LandingNavbar from "@/components/LandingNavbar";

type LegalPageShellProps = {
  children: React.ReactNode;
};

export default function LegalPageShell({ children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50/50 to-[hsl(var(--turmeric))]/20">
      <LandingNavbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 md:py-14">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
