import SodieAvatar, { type SodieSize } from "@/components/SodieAvatar";

interface SodieEmptyStateProps {
  message: string;
  size?: SodieSize;
  className?: string;
}

export default function SodieEmptyState({
  message,
  size = "md",
  className = "",
}: SodieEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center text-center gap-3 py-6 px-4 ${className}`}
    >
      <SodieAvatar size={size} animate="none" />
      <p className="font-body text-sm text-muted-foreground max-w-sm">
        {message}
      </p>
    </div>
  );
}
