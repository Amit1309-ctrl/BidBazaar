import Image from "next/image";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Deterministic soft accent so the same company always gets the same
// fallback tint, rather than a random flash between renders.
function accentFor(name: string) {
  const palette = ["#17A673", "#E8B54A", "#5B8CFF", "#C9865A", "#B278E8"];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % palette.length;
  return palette[hash];
}

export function CompanyLogo({
  name,
  logoUrl,
  size = 40,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={cn("rounded-[10px] object-cover", className)}
      />
    );
  }

  const color = accentFor(name);
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-[10px] font-display font-semibold text-black", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}
