"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Light normalization for common LLM quirks before markdown parse.
 * Does not invent list structure — only restores newlines so GFM can see
 * numbered/bulleted items that were jammed into one paragraph.
 */
export function prepareSodieMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    // "…tips: 1. Foo 2. Bar" → break before numbered markers
    .replace(/([^\n])\s+(\d+)\.\s+/g, "$1\n\n$2. ")
    // "…tips: - Foo - Bar" / "* Foo" jammed inline
    .replace(/([^\n])\s+([-*])\s+/g, "$1\n\n$2 ")
    .trim();
}

type SodieMarkdownProps = {
  text: string;
  className?: string;
};

/**
 * Full markdown render for Sodie coach replies (GFM lists, emphasis, etc.).
 */
export function SodieMarkdown({ text, className }: SodieMarkdownProps) {
  return (
    <div
      className={cn(
        "sodie-md text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_li]:pl-0.5 [&_strong]:font-semibold",
        "[&_a]:underline [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:text-[0.9em]",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/5 [&_pre]:p-2",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {prepareSodieMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}

export function threadHistoryLabel(
  scope: string,
  contextId: string | undefined,
  recipeNames: Record<string, string>
): string {
  if (scope === "plan") {
    if (contextId && /^\d+$/.test(contextId)) return `Week ${contextId}`;
    return "Weekly plan";
  }
  if ((scope === "recipe" || scope === "kitchen") && contextId) {
    const name = recipeNames[contextId];
    if (name) return name;
    return scope === "kitchen" ? "Kitchen" : "Recipe";
  }
  if (scope === "personal_recipe") {
    if (contextId) {
      const name = recipeNames[contextId];
      if (name) return name;
      return "My recipe";
    }
    return "My Recipes";
  }
  if (scope === "kitchen") return "Kitchen";
  if (scope === "shopping") return "Shopping";
  if (scope === "settings") return "Settings";
  if (scope === "analytics") return "Analytics";
  if (scope === "global") return "General";
  return scope;
}
