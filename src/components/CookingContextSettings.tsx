"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useUser } from "@/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BASELINE = ["Neutral cooking oil", "Table salt", "Black pepper", "Soy sauce", "Cornstarch", "White sugar", "Garlic", "Yellow onions"];

export default function CookingContextSettings() {
  const { user, updateUserProfile } = useUser();
  const [city, setCity] = useState("");
  const [retailer, setRetailer] = useState("");
  const [memory, setMemory] = useState(false);
  const [retention, setRetention] = useState<"3_months" | "18_months" | "36_months" | "manual">("18_months");
  const [items, setItems] = useState<string[]>(BASELINE);
  const [item, setItem] = useState("");

  useEffect(() => {
    if (!user) return;
    setCity(user.city ?? ""); setRetailer(user.preferred_retailer ?? "");
    setMemory(user.sodie_memory_enabled ?? false); setRetention(user.chat_retention_policy ?? "18_months");
    api.getPantryItems().then((saved) => saved.length && setItems(saved.map((entry) => entry.name))).catch(() => {});
  }, [user]);

  async function save() {
    if (!user) return;
    await updateUserProfile({ ...user, city: city || undefined, preferred_retailer: retailer || undefined, sodie_memory_enabled: memory, chat_retention_policy: retention });
    await api.replacePantryItems(items.map((name) => ({ name, is_baseline: BASELINE.includes(name) })));
    toast.success("Cooking context saved");
  }

  return <section className="space-y-4 rounded-xl border-2 border-[hsl(var(--sage))]/30 bg-[hsl(var(--sage))]/5 p-4">
    <div><h2 className="font-heading text-lg font-bold">Sodie & shopping context</h2><p className="text-sm text-muted-foreground">Used for future shopping and personalized help.</p></div>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="city">City</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Vancouver" /></div><div><Label htmlFor="retailer">Preferred retailer</Label><Input id="retailer" value={retailer} onChange={(e) => setRetailer(e.target.value)} placeholder="e.g., No Frills" /></div></div>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={memory} onChange={(e) => setMemory(e.target.checked)} /> <span><strong>Enable Sodie Memory</strong><br />Let Sodie save only approved preferences. You will be able to review and forget them.</span></label>
    <div><Label htmlFor="retention">Chat retention</Label><select id="retention" value={retention} onChange={(e) => setRetention(e.target.value as typeof retention)} className="mt-1 w-full rounded-md border p-2"><option value="3_months">3 months</option><option value="18_months">18 months</option><option value="36_months">36 months</option><option value="manual">Keep until I delete</option></select></div>
    <div><Label>Pantry baseline</Label><p className="text-sm text-muted-foreground">Remove items you do not normally keep; add your staples.</p><div className="mt-2 flex flex-wrap gap-2">{items.map((name) => <button key={name} type="button" onClick={() => setItems((current) => current.filter((value) => value !== name))} className="rounded-full border px-3 py-1 text-sm">{name} ×</button>)}</div><div className="mt-2 flex gap-2"><Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add pantry item" /><Button type="button" variant="outline" onClick={() => { const name = item.trim(); if (name && !items.some((value) => value.toLowerCase() === name.toLowerCase())) setItems([...items, name]); setItem(""); }}>Add</Button></div></div>
    <Button type="button" variant="outline" onClick={() => void save()}>Save Sodie & pantry settings</Button>
  </section>;
}
