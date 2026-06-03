import { cn } from "@/lib/utils";

type RecipeInstructionListProps = {
  steps: string[];
  className?: string;
};

/**
 * Numbered steps: fixed-width badge column + text column. Badge is nudged to
 * align with the first line of each step (single- or multi-line).
 */
export default function RecipeInstructionList({
  steps,
  className,
}: RecipeInstructionListProps) {
  return (
    <ol className={cn("m-0 list-none space-y-4 p-0 text-base", className)}>
      {steps.map((step, idx) => (
        <li key={idx} className="flex gap-3 text-muted-foreground">
          <span
            aria-hidden
            className="box-border flex size-11 shrink-0 grow-0 basis-11 items-center justify-center rounded-full bg-[hsl(var(--paprika))]/20 text-sm font-semibold leading-none text-primary tabular-nums [margin-top:calc(0.8125em-1.375rem)]"
          >
            {idx + 1}
          </span>
          <p className="m-0 min-w-0 flex-1 leading-[1.625]">{step}</p>
        </li>
      ))}
    </ol>
  );
}
