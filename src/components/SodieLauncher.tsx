"use client";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function SodieLauncher() {
  const [open, setOpen] = useState(false), [temporary, setTemporary] = useState(false), [threadId, setThreadId] = useState<string | null>(null), [input, setInput] = useState(""), [messages, setMessages] = useState<{ sender: "user" | "ai"; content: string }[]>([]), [sending, setSending] = useState(false);
  async function send() { if (!input.trim() || sending) return; setSending(true); try { const thread = threadId ? { id: threadId } : await api.createSodieThread("global", temporary); setThreadId(thread.id); const response = await api.sendSodieMessage(thread.id, input.trim()); setMessages((old) => [...old, { sender: "user", content: response.user_message.content }, { sender: "ai", content: response.ai_message.content }]); setInput(""); } finally { setSending(false); } }
  return <div className="fixed bottom-5 right-5 z-40">
    {open && <section className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border bg-white p-4 shadow-xl"><div className="flex items-center justify-between"><div className="flex gap-2"><SodieAvatar size="sm" animate="none" /><strong>Ask Sodie</strong></div><Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close Sodie"><X /></Button></div><label className="mt-3 flex gap-2 text-xs"><input type="checkbox" checked={temporary} disabled={!!threadId} onChange={(e) => setTemporary(e.target.checked)} /> Private session — not shown in history or used for memory</label><div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{messages.map((message, index) => <p key={index} className={message.sender === "ai" ? "rounded bg-amber-50 p-2 text-sm" : "rounded bg-primary p-2 text-sm text-white"}>{message.content}</p>)}</div><Textarea className="mt-3" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about what you’re cooking…" /><Button className="mt-2 w-full" disabled={!input.trim() || sending} onClick={() => void send()}>{sending ? "Sodie is thinking…" : "Send"}</Button></section>}
    <Button size="icon" className="h-14 w-14 rounded-full" onClick={() => setOpen(!open)} aria-label="Open Sodie chat"><MessageCircle /></Button>
  </div>;
}
