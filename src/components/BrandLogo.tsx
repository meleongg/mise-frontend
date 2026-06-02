import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md";
  showWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

const logoSizes = {
  sm: { icon: 32, wordmark: "text-xl" },
  md: { icon: 40, wordmark: "text-2xl" },
} as const;

export default function BrandLogo({
  href = "/",
  size = "md",
  showWordmark = true,
  className = "",
  onClick,
}: BrandLogoProps) {
  const { icon, wordmark } = logoSizes[size];

  const content = (
    <>
      <Image
        src="/brand/mise-dark.svg"
        alt="Mise"
        width={icon}
        height={icon}
        className="shrink-0 rounded-lg"
        priority
      />
      {showWordmark && (
        <span
          className={`font-heading font-black ${wordmark} text-[#262218] truncate tracking-tight`}
        >
          Mise
        </span>
      )}
    </>
  );

  const linkClass = `flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-90 transition-opacity ${className}`;

  if (href) {
    return (
      <Link href={href} className={linkClass} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div className={linkClass} onClick={onClick} role="presentation">
      {content}
    </div>
  );
}
