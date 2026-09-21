"use client";

import BackNavButton from "@/components/BackNavButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersonalRecipesQuery } from "@/hooks/queries";
import { BookHeart } from "lucide-react";
import Link from "next/link";

function previewText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item
          : item && typeof item === "object" && "name" in item
            ? String((item as { name: unknown }).name)
            : JSON.stringify(item)
      )
      .slice(0, 4)
      .join(", ");
  }
  return "";
}

export default function MyRecipesPage() {
  const { data: recipes = [], isLoading, isError } = usePersonalRecipesQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-16">
        <BackNavButton href="/weekly-plan">Back to weekly plan</BackNavButton>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-orange-50 to-amber-100">
            <BookHeart className="h-6 w-6 text-[hsl(var(--paprika))]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">My Recipes</h1>
            <p className="text-sm text-stone-600">
              Recipes you’ve edited with Sodie and saved for reuse.
            </p>
          </div>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        )}
        {isError && (
          <p className="mt-6 text-sm text-red-600">Could not load My Recipes.</p>
        )}

        {!isLoading && !isError && recipes.length === 0 && (
          <Card className="mt-6 border-2 border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--paprika))]">
                No personal recipes yet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-600">
              <p>
                Open a recipe from your weekly plan, tap{" "}
                <strong className="text-stone-800">Edit with Sodie</strong>, then
                approve the proposal to save a copy here.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 text-white hover:from-orange-600 hover:to-[hsl(var(--paprika))]"
              >
                <Link href="/weekly-plan">Browse this week’s plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 space-y-4">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="border-2 border-[hsl(var(--paprika))]/20 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 shadow-sm transition hover:border-[hsl(var(--paprika))]/45 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-stone-900">{recipe.name}</CardTitle>
                  <span className="inline-flex items-center rounded-full border border-[hsl(var(--paprika))]/30 bg-[hsl(var(--paprika))]/10 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--paprika))]">
                    Edited with Sodie
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revision {recipe.current_revision}
                  {recipe.portion_size ? ` · ${recipe.portion_size}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {recipe.notes && (
                  <p className="rounded-lg border border-[hsl(var(--turmeric))]/25 bg-amber-50/90 px-3 py-2 text-stone-700">
                    {recipe.notes}
                  </p>
                )}
                <p className="text-stone-600">
                  Ingredients: {previewText(recipe.ingredients) || "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="bg-[hsl(var(--paprika))] text-white hover:bg-[hsl(var(--paprika))]/90"
                  >
                    <Link href={`/my-recipes/${recipe.id}`}>Open</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Coming with plan entries"
                    className="border-[hsl(var(--sage))]/40 text-[hsl(var(--sage))]"
                  >
                    Schedule (soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
