"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BASELINE = [
  "Neutral cooking oil",
  "Table salt",
  "Black pepper",
  "Soy sauce",
  "Cornstarch",
  "White sugar",
  "Garlic",
  "Yellow onions",
];

type Retention = "3_months" | "18_months" | "36_months" | "manual";

export default function CookingContextSettings() {
  const { user, updateUserProfile } = useUser();
  const [city, setCity] = useState("");
  const [retailer, setRetailer] = useState("");
  const [memory, setMemory] = useState(false);
  const [retention, setRetention] = useState<Retention>("18_months");
  const [items, setItems] = useState<string[]>(BASELINE);
  const [item, setItem] = useState("");
  const [savingShopping, setSavingShopping] = useState(false);
  const [savingSodie, setSavingSodie] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCity(user.city ?? "");
    setRetailer(user.preferred_retailer ?? "");
    setMemory(user.sodie_memory_enabled ?? false);
    setRetention(user.chat_retention_policy ?? "18_months");
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
      await api.replacePantryItems(
        items.map((name) => ({
          name,
          is_baseline: BASELINE.includes(name),
        }))
      );
      toast.success("Shopping & pantry saved");
    } catch {
      toast.error("Could not save shopping settings");
    } finally {
      setSavingShopping(false);
    }
  }

  async function saveSodie() {
    if (!user) return;
    setSavingSodie(true);
    try {
      const ok = await updateUserProfile({
        ...user,
        sodie_memory_enabled: memory,
        chat_retention_policy: retention,
      });
      if (!ok) {
        toast.error("Could not save Sodie settings");
        return;
      }
      toast.success("Sodie privacy settings saved");
    } catch {
      toast.error("Could not save Sodie settings");
    } finally {
      setSavingSodie(false);
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
    <div className="space-y-6">
      <section className="space-y-5 rounded-xl border-2 border-[hsl(var(--paprika))]/25 bg-white/90 p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-[#262218]">
            Shopping & pantry
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Location and staples for future shopping lists. Separate from Sodie
            chat privacy.
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
              placeholder="e.g., No Frills"
              className="border-2 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Pantry baseline</Label>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Remove items you do not normally keep; add your staples.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {items.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  setItems((current) => current.filter((value) => value !== name))
                }
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 hover:border-stone-300 hover:bg-stone-100"
              >
                {name} ×
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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
              className="shrink-0 border-[hsl(var(--paprika))]/30"
              onClick={addItem}
            >
              Add
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={savingShopping}
          className="border-[hsl(var(--paprika))]/30"
          onClick={() => void saveShopping()}
        >
          {savingShopping ? "Saving…" : "Save shopping & pantry"}
        </Button>
      </section>

      <section className="space-y-5 rounded-xl border-2 border-[hsl(var(--sage))]/30 bg-[hsl(var(--sage))]/5 p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-[#262218]">
            Sodie privacy
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Memory and how long regular (non-private) chats are kept. Does not
            change shopping settings.
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-[hsl(var(--sage))]/25 bg-white/70 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-900">
              Enable Sodie Memory
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Let Sodie save only approved preferences. You will be able to
              review and forget them.
            </p>
          </div>
          <Switch
            checked={memory}
            onCheckedChange={setMemory}
            aria-label="Enable Sodie Memory"
            className="mt-0.5 shrink-0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="retention" className="text-sm font-semibold">
            Chat retention
          </Label>
          <select
            id="retention"
            value={retention}
            onChange={(e) => setRetention(e.target.value as Retention)}
            className="w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="3_months">3 months</option>
            <option value="18_months">18 months</option>
            <option value="36_months">36 months</option>
            <option value="manual">Keep until I delete</option>
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={savingSodie}
          className="border-[hsl(var(--sage))]/40"
          onClick={() => void saveSodie()}
        >
          {savingSodie ? "Saving…" : "Save Sodie privacy"}
        </Button>
      </section>
    </div>
  );
}
