"use client";

import BackNavButton from "@/components/BackNavButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  useActiveShoppingListQuery,
  useGenerateShoppingListMutation,
  useUpdateShoppingListItemMutation,
  useWeeklyPlansQuery,
} from "@/hooks/queries";
import { Loader2, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function ShoppingPage() {
  const { user } = useAuth();
  const { data: weeklyPlans } = useWeeklyPlansQuery(user?.id);
  const latestWeek = useMemo(() => {
    if (!weeklyPlans?.length) return undefined;
    return Math.max(...weeklyPlans.map((plan) => plan.week_number));
  }, [weeklyPlans]);

  const {
    data: shoppingList,
    isLoading,
    isError,
  } = useActiveShoppingListQuery(latestWeek, !!latestWeek);
  const generateMutation = useGenerateShoppingListMutation();
  const updateMutation = useUpdateShoppingListItemMutation(latestWeek);

  const isGenerating = generateMutation.isPending;
  const checkedCount =
    shoppingList?.items.filter((item) => item.is_checked).length ?? 0;
  const totalCount = shoppingList?.items.length ?? 0;

  const locationLabel = [
    shoppingList?.retailer_snapshot || user?.preferred_retailer,
    shoppingList?.location_snapshot || user?.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-16">
        <BackNavButton href="/weekly-plan">Back to weekly plan</BackNavButton>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-orange-50 to-amber-100">
              <ShoppingBasket className="h-6 w-6 text-[hsl(var(--paprika))]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Shopping</h1>
              <p className="text-sm text-stone-600">
                Best-effort list from this week’s plan entries.
                {locationLabel ? ` ${locationLabel}` : ""}
              </p>
            </div>
          </div>
          {latestWeek != null && (
            <Button
              onClick={() => generateMutation.mutate(latestWeek)}
              disabled={isGenerating}
              aria-busy={isGenerating}
              className="shrink-0 bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 text-white hover:from-orange-600 hover:to-[hsl(var(--paprika))]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {shoppingList ? "Refreshing…" : "Generating…"}
                </>
              ) : shoppingList ? (
                "Refresh list"
              ) : (
                "Generate list"
              )}
            </Button>
          )}
        </div>

        {!latestWeek && (
          <Card className="mt-6 border-2 border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--paprika))]">
                No weekly plan yet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-600">
              <p>Generate a weekly plan first, then build a shopping list from it.</p>
              <Button
                asChild
                className="bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 text-white hover:from-orange-600 hover:to-[hsl(var(--paprika))]"
              >
                <Link href="/weekly-plan">Go to weekly plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {latestWeek != null && isLoading && !isGenerating && (
          <p className="mt-6 text-sm text-muted-foreground">Loading shopping list…</p>
        )}
        {isError && (
          <p className="mt-6 text-sm text-red-600">Could not load shopping list.</p>
        )}
        {generateMutation.isError && (
          <p className="mt-4 text-sm text-red-600">
            Could not generate shopping list. Confirm the plan has entries and
            hosted migrations are applied.
          </p>
        )}

        {isGenerating && (
          <Card className="mt-6 border-2 border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 shadow-md">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-stone-700">
              <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--paprika))]" />
              <div>
                <p className="font-medium text-stone-900">
                  {shoppingList
                    ? "Refreshing your shopping list…"
                    : "Building your shopping list…"}
                </p>
                <p className="mt-1 text-stone-600">
                  Aggregating ingredients from this week’s plan entries.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {latestWeek != null && !isLoading && !isGenerating && !shoppingList && (
          <Card className="mt-6 border-2 border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--paprika))]">
                No list for week {latestWeek}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-600">
              Tap <strong className="text-stone-800">Generate list</strong> to
              aggregate ingredients from plan entries. Checked and manual edits
              survive refresh.
            </CardContent>
          </Card>
        )}

        {shoppingList && !isGenerating && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <p className="font-medium text-stone-800">{shoppingList.title}</p>
              <p>
                {checkedCount}/{totalCount} checked
              </p>
            </div>
            {shoppingList.items.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-[hsl(var(--paprika))]/20 bg-white/80 px-4 py-3 shadow-sm transition hover:border-[hsl(var(--paprika))]/40"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-[hsl(var(--paprika))]"
                  checked={item.is_checked}
                  disabled={updateMutation.isPending}
                  onChange={(event) =>
                    updateMutation.mutate({
                      itemId: item.id,
                      updates: { is_checked: event.target.checked },
                    })
                  }
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-base font-medium ${
                      item.is_checked
                        ? "text-stone-400 line-through"
                        : "text-stone-900"
                    }`}
                  >
                    {item.display_text}
                  </span>
                  {item.needs_review && (
                    <span className="mt-0.5 block text-xs text-amber-700">
                      Needs review
                      {item.reason ? `: ${item.reason}` : ""}
                    </span>
                  )}
                  {item.sources.length > 0 && (
                    <span className="mt-1 block text-xs text-stone-500">
                      From {item.sources.length} recipe
                      {item.sources.length === 1 ? "" : "s"}
                      {item.sources
                        .map((source) => source.source_amount)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(" · ")
                        ? ` · ${item.sources
                            .map((source) => source.source_amount)
                            .filter(Boolean)
                            .slice(0, 3)
                            .join(" · ")}`
                        : ""}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
