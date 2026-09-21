"use client";

import BackNavButton from "@/components/BackNavButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersonalRecipeQuery } from "@/hooks/queries";
import { use } from "react";

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

export default function PersonalRecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: recipe, isLoading, isError } = usePersonalRecipeQuery(id);

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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{recipe.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Personal revision {recipe.current_revision}
              {recipe.portion_size ? ` · ${recipe.portion_size}` : ""}
            </p>
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
            <p className="text-muted-foreground">
              Scheduling into a weekly plan will arrive with plan-entry
              snapshots. Until then, this personal copy is saved for reuse.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
