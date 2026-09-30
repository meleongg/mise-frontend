import { cn } from "@/lib/utils";

type RecipeInstructionListProps = {
  steps: string[];
  className?: string;
};

/**
 * Numbered steps with a fixed badge column. Badge height equals the text
 * line-height so the number sits on the first line without margin hacks —
 * multi-line steps keep the badge top-aligned to that first line.
 */
export default function RecipeInstructionList({
  steps,
  className,
}: RecipeInstructionListProps) {
  return (
    <ol className={cn("m-0 list-none space-y-4 p-0 text-base", className)}>
      {steps.map((step, idx) => (
        <li
          key={idx}
          className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 text-muted-foreground"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--paprika))]/20 text-sm font-semibold leading-none text-primary tabular-nums"
          >
            {idx + 1}
          </span>
          <p className="m-0 min-w-0 text-base leading-7">{step}</p>
        </li>
      ))}
    </ol>
  );
}
