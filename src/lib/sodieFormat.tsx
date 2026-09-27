import { Fragment, type ReactNode } from "react";

/** Soften run-on numbered tips into separate lines for chat bubbles. */
export function normalizeSodieProse(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+(\d+)\.\s+/g, "$1\n\n$2. ")
    .trim();
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={index} className="font-semibold">
          {bold[1]}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

/**
 * Lightweight markdown for Sodie coach replies (bold + paragraphs/lists).
 * No extra dependency — enough for MVP chat formatting.
 */
export function renderSodieMessageContent(text: string): ReactNode {
  const normalized = normalizeSodieProse(text);
  const blocks = normalized.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const listItems = lines.every((line) => /^\d+\.\s+/.test(line));
        if (listItems) {
          return (
            <ol
              key={blockIndex}
              className="list-decimal space-y-1.5 pl-5 marker:font-semibold"
            >
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="pl-0.5">
                  {renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
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
  if (scope === "kitchen") return "Kitchen";
  if (scope === "shopping") return "Shopping";
  if (scope === "global") return "General";
  return scope;
}
