"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DEFAULT_PANTRY = [
  "Neutral cooking oil",
  "Table salt",
  "Black pepper",
  "Soy sauce",
  "Cornstarch",
  "White sugar",
  "Garlic",
  "Yellow onions",
];

const CARD_CLASS =
  "shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm";

const SAVE_CLASS =
  "w-full sm:w-auto min-w-[12rem] px-8 font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 text-white hover:from-orange-600 hover:to-[hsl(var(--paprika))] shadow-md";

export default function CookingContextSettings() {
  const { user, updateUserProfile } = useUser();
  const [city, setCity] = useState("");
  const [retailer, setRetailer] = useState("");
  const [items, setItems] = useState<string[]>(DEFAULT_PANTRY);
  const [item, setItem] = useState("");
  const [savingShopping, setSavingShopping] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCity(user.city ?? "");
    setRetailer(user.preferred_retailer ?? "");
    api
      .getPantryItems()
      .then((saved) => {
        if (saved.length) setItems(saved.map((entry) => entry.name));
      })
      .catch(() => {});
  }, [user]);

  async function saveShopping() {
    if (!user) return;
    setSavingShopping(true);
    try {
      const ok = await updateUserProfile({
        ...user,
        city: city || undefined,
        preferred_retailer: retailer || undefined,
      });
      if (!ok) {
        toast.error("Could not save shopping settings");
        return;
      }
      await api.replacePantryItems(items.map((name) => ({ name })));
      toast.success("Shopping & pantry saved");
    } catch {
      toast.error("Could not save shopping settings");
    } finally {
      setSavingShopping(false);
    }
  }

  function addItem() {
    const name = item.trim();
    if (!name) return;
    if (items.some((value) => value.toLowerCase() === name.toLowerCase())) {
      setItem("");
      return;
    }
    setItems([...items, name]);
    setItem("");
  }

  return (
    <Card className={CARD_CLASS}>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-[#262218]">
            Shopping & pantry
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Location and staples for shopping lists. Use “I have this” on a list
            to omit items with confirmation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-semibold">
              City
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Vancouver"
              className="border-2 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retailer" className="text-sm font-semibold">
              Preferred retailer
            </Label>
            <Input
              id="retailer"
              value={retailer}
              onChange={(e) => setRetailer(e.target.value)}
              placeholder="e.g., Costco"
              className="border-2 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Pantry staples</Label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ingredients you usually keep on hand.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {items.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  setItems((current) =>
                    current.filter((value) => value !== name)
                  )
                }
                className="rounded-full border-2 border-[hsl(var(--paprika))]/20 bg-[hsl(var(--paprika))]/5 px-3 py-1.5 text-sm text-stone-700 hover:border-[hsl(var(--paprika))]/40"
              >
                {name} ×
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Add pantry item"
              className="border-2 focus:border-primary"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-[hsl(var(--paprika))]/30 font-body"
              onClick={addItem}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            size="touch"
            disabled={savingShopping}
            className={SAVE_CLASS}
            onClick={() => void saveShopping()}
          >
            {savingShopping ? "Saving..." : "Save shopping & pantry"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
