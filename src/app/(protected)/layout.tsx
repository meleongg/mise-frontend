"use client";

import AuthGuard from "@/components/AuthGuard";
import ClientNavbar from "@/components/ClientNavbar";
import { useUser } from "@/hooks";
import {
  useAllWeeksRecipeProgressQueries,
  useWeeklyPlansQuery,
} from "@/hooks/queries";
import { useMemo } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { data: weeklyPlans } = useWeeklyPlansQuery(user?.id);

  const weekNumbers = useMemo(
    () => weeklyPlans?.map((plan) => plan.week_number) ?? [],
    [weeklyPlans]
  );

  useAllWeeksRecipeProgressQueries(user?.id, weekNumbers);

  return (
    <AuthGuard requireOnboarding>
      <div className="flex flex-col min-h-screen">
        <ClientNavbar />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
