"use client";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function SodieLauncher() {
  const [open, setOpen] = useState(false); const [temporary, setTemporary] = useState(false); const [threadId, setThreadId] = useState<string | null>(null);
  async function start() { const thread = await api.createSodieThread("global", temporary); setThreadId(thread.id); }
  return <div className="fixed bottom-5 right-5 z-40">
    {open && <section className="mb-3 w-80 rounded-2xl border bg-white p-4 shadow-xl"><div className="flex items-center justify-between"><div className="flex gap-2"><SodieAvatar size="sm" animate="none" /><strong>Ask Sodie</strong></div><Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close Sodie"><X /></Button></div><p className="mt-3 text-sm text-muted-foreground">Sodie is ready wherever you cook. Persistent reply chat is being connected to this thread.</p><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={temporary} onChange={(e) => setTemporary(e.target.checked)} /> Private session — not shown in history or used for memory</label><Button className="mt-3 w-full" onClick={() => void start()}>{threadId ? "Thread started" : "Start chat"}</Button></section>}
    <Button size="icon" className="h-14 w-14 rounded-full" onClick={() => setOpen(!open)} aria-label="Open Sodie chat"><MessageCircle /></Button>
  </div>;
}
