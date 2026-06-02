import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/components/QueryProvider";
import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-heading",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Mise — Your Adaptive Cooking Companion",
  description:
    "Personalized weekly meal plans that adapt to your skill, taste, and feedback. Cook with Sodie, your culinary companion.",
  appleWebApp: {
    title: "Mise",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>
          <QueryProvider>
            <AppProvider>{children}</AppProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
