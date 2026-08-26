import Link from "next/link";
import { CATEGORY_LABELS, CITIES, type Category } from "@/types";
import { cn } from "@/lib/cn";

const CATEGORY_ENTRIES = Object.entries(CATEGORY_LABELS) as [Category, string][];

export function CategoryFilterBar({ active }: { active?: Category }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill href="/leaderboard" active={!active}>
        All
      </Pill>
      {CATEGORY_ENTRIES.map(([slug, label]) => (
        <Pill key={slug} href={`/${slug}`} active={active === slug}>
          {label}
        </Pill>
      ))}
    </div>
  );
}

export function CityFilterBar({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill href="/leaderboard" active={!active}>
        All cities
      </Pill>
      {CITIES.map((city) => (
        <Pill key={city} href={`/${slugifyCity(city)}`} active={active === city}>
          {city}
        </Pill>
      ))}
    </div>
  );
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

function Pill({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-pill border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-rupee/50 bg-rupee/15 text-rupee-bright"
          : "border-base-border text-ink-secondary hover:border-base-borderHover hover:text-ink-primary"
      )}
    >
      {children}
    </Link>
  );
}
