import Link from "next/link";

export default function AuthLegalLinks() {
  return (
    <p className="text-xs text-muted-foreground text-center px-4 pb-6 leading-relaxed">
      By using Mise you agree to our{" "}
      <Link
        href="/terms"
        className="text-[hsl(var(--paprika))] underline-offset-2 hover:underline font-medium"
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="text-[hsl(var(--paprika))] underline-offset-2 hover:underline font-medium"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
