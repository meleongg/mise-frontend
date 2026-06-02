"use client";

import AuthGuard from "@/components/AuthGuard";
import ClientNavbar from "@/components/ClientNavbar";
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@/hooks";
import {
  useWeeklyPlansQuery,
  useWeeklyRecipeProgressQuery,
} from "@/hooks/queries";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { state } = useApp();
  const currentWeek = state.currentWeek;

  useWeeklyPlansQuery(user?.id);
  useWeeklyRecipeProgressQuery(user?.id, currentWeek);

  return (
    <AuthGuard requireOnboarding>
      <div className="flex flex-col min-h-screen">
        <ClientNavbar />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
