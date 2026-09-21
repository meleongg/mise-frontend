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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <BackNavButton href="/weekly-plan">Back to weekly plan</BackNavButton>
      <div className="mt-4 flex items-center gap-3">
        <BookHeart className="h-6 w-6 text-[hsl(var(--paprika))]" />
        <div>
          <h1 className="text-2xl font-semibold">My Recipes</h1>
          <p className="text-sm text-muted-foreground">
            Personal copies saved from approved Sodie edits.
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No personal recipes yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Open a recipe from your weekly plan, tap{" "}
              <strong>Edit with Sodie</strong>, then approve the proposal to save
              a copy here.
            </p>
            <Button asChild variant="outline">
              <Link href="/weekly-plan">Browse this week’s plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle>{recipe.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your copy · revision {recipe.current_revision}
                {recipe.portion_size ? ` · ${recipe.portion_size}` : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recipe.notes && <p>{recipe.notes}</p>}
              <p className="text-muted-foreground">
                Ingredients: {previewText(recipe.ingredients) || "—"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/my-recipes/${recipe.id}`}>Open</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  title="Coming with plan entries"
                >
                  Schedule (soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
