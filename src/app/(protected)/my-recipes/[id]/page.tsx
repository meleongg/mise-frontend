"use client";

import BackNavButton from "@/components/BackNavButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [error, setError] = useState("");

  async function handleArchive() {
    if (!recipe || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.archivePersonalRecipe(recipe.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.personalRecipes() });
      setShowRemoveDialog(false);
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
        <Card className="mt-6 overflow-hidden border-2 border-[hsl(var(--paprika))]/25 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 shadow-md">
          {recipe.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.image_url}
              alt=""
              className="h-48 w-full object-cover"
            />
          )}
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
              {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
            </p>
            {(dietary.length > 0 || allergens.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {dietary.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[hsl(var(--sage))]/40 bg-[hsl(var(--sage))]/10 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--sage))]"
                  >
                    {tag}
                  </span>
                ))}
                {allergens.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[hsl(var(--paprika))]/30 bg-[hsl(var(--paprika))]/10 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--paprika))]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {recipe.notes && (
              <section className="rounded-lg border border-[hsl(var(--turmeric))]/30 bg-amber-50/80 px-3 py-2">
                <h2 className="font-semibold text-stone-800">Notes</h2>
                <p className="mt-1 text-stone-700">{recipe.notes}</p>
              </section>
            )}
            <section className="rounded-lg border border-[hsl(var(--paprika))]/15 bg-white/80 px-3 py-3">
              <h2 className="font-semibold text-[hsl(var(--paprika))]">
                Ingredients
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-800">
                {asList(recipe.ingredients).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-lg border border-[hsl(var(--sage))]/25 bg-[hsl(var(--sage))]/5 px-3 py-3">
              <h2 className="font-semibold text-[hsl(var(--sage))]">
                Instructions
              </h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-stone-800">
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
                className="border-2 border-[hsl(var(--paprika))]/40 text-[hsl(var(--paprika))] hover:bg-[hsl(var(--paprika))]/10"
                onClick={() => setShowRemoveDialog(true)}
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

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent
          showCloseButton={false}
          className="bg-white border-2 border-[hsl(var(--paprika))]/40 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--paprika))]">
              Remove from My Recipes?
            </DialogTitle>
            <DialogDescription className="mt-2 text-stone-600">
              {recipe
                ? `“${recipe.name}” will leave My Recipes. You can still cook the catalog version from your plan, and you can create a new personal copy later with Edit with Sodie.`
                : "This personal copy will leave My Recipes."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-[100px] border-[hsl(var(--paprika))]/30 sm:w-auto"
              disabled={busy}
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full min-w-[120px] bg-[hsl(var(--paprika))] text-white hover:bg-[hsl(var(--paprika))]/90 sm:w-auto"
              disabled={busy}
              onClick={() => void handleArchive()}
            >
              {busy ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
