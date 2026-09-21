"use client";

import BackNavButton from "@/components/BackNavButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys, usePersonalRecipeQuery } from "@/hooks/queries";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

function asList(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const row = item as {
        name?: unknown;
        measure?: unknown;
        text?: unknown;
        step?: unknown;
      };
      if (row.text) return `${row.step ? `${row.step}. ` : ""}${String(row.text)}`;
      if (row.name)
        return `${row.measure ? `${row.measure} ` : ""}${String(row.name)}`;
    }
    return JSON.stringify(item);
  });
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

export default function PersonalRecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: recipe, isLoading, isError } = usePersonalRecipeQuery(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleArchive() {
    if (!recipe || busy) return;
    if (!window.confirm(`Remove “${recipe.name}” from My Recipes?`)) return;
    setBusy(true);
    setError("");
    try {
      await api.archivePersonalRecipe(recipe.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.personalRecipes() });
      router.push("/my-recipes");
    } catch {
      setError("Could not remove that recipe.");
    } finally {
      setBusy(false);
    }
  }

  const dietary = asTags(recipe?.dietary_tags);
  const allergens = asTags(recipe?.allergens);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <BackNavButton href="/my-recipes">Back to My Recipes</BackNavButton>
      {isLoading && (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-red-600">Personal recipe not found.</p>
      )}
      {recipe && (
        <Card className="mt-6 overflow-hidden">
          {recipe.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.image_url}
              alt=""
              className="h-48 w-full object-cover"
            />
          )}
          <CardHeader>
            <CardTitle>{recipe.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your copy · revision {recipe.current_revision}
              {recipe.portion_size ? ` · ${recipe.portion_size}` : ""}
              {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
            </p>
            {(dietary.length > 0 || allergens.length > 0) && (
              <p className="text-xs text-muted-foreground">
                {dietary.length > 0 && `Dietary: ${dietary.join(", ")}`}
                {dietary.length > 0 && allergens.length > 0 && " · "}
                {allergens.length > 0 && `Allergens: ${allergens.join(", ")}`}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {recipe.notes && (
              <section>
                <h2 className="font-semibold">Notes</h2>
                <p className="mt-1">{recipe.notes}</p>
              </section>
            )}
            <section>
              <h2 className="font-semibold">Ingredients</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {asList(recipe.ingredients).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-semibold">Instructions</h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                {asList(recipe.instructions).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void handleArchive()}
              >
                Remove from My Recipes
              </Button>
            </div>
            <p className="text-muted-foreground">
              Scheduling into a weekly plan will arrive with plan-entry
              snapshots. Until then, this is your reusable personal copy of the
              catalog dish.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
