import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { LeaderboardBoard } from "@/components/LeaderboardBoard";
import { CategoryFilterBar, CityFilterBar } from "@/components/CategoryFilterBar";
import { CATEGORY_LABELS, CITIES, type Category, type City } from "@/types";
import { getLeaderboard } from "@/lib/data";

export const revalidate = 30;

const CITY_SLUGS: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.toLowerCase().replace(/\s+/g, "-"), c])
) as Record<string, City>;

const SPECIAL_PAGES = {
  "top-this-week": { title: "Top this week", sort: "bid" as const },
  "most-clicked": { title: "Most clicked", sort: "clicks" as const },
  "biggest-movers": { title: "Biggest movers", sort: "bid" as const },
  "new": { title: "New on the board", sort: "recent" as const },
} as const;

function resolve(slug: string) {
  if (slug in CATEGORY_LABELS) return { kind: "category" as const, category: slug as Category };
  if (slug in CITY_SLUGS) return { kind: "city" as const, city: CITY_SLUGS[slug] };
  if (slug in SPECIAL_PAGES) return { kind: "special" as const, page: SPECIAL_PAGES[slug as keyof typeof SPECIAL_PAGES] };
  return null;
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const resolved = resolve(params.slug);
  if (!resolved) return {};
  if (resolved.kind === "category") return { title: `${CATEGORY_LABELS[resolved.category]} startups` };
  if (resolved.kind === "city") return { title: `Startups in ${resolved.city}` };
  return { title: resolved.page.title };
}

export default async function DiscoveryPage({ params }: { params: { slug: string } }) {
  const resolved = resolve(params.slug);
  if (!resolved) notFound();

  let listings = await getLeaderboard(
    resolved.kind === "category" ? { category: resolved.category } :
    resolved.kind === "city" ? { city: resolved.city } : {}
  );

  let heading = "";
  if (resolved.kind === "category") heading = `${CATEGORY_LABELS[resolved.category]} startups`;
  if (resolved.kind === "city") heading = `Startups in ${resolved.city}`;
  if (resolved.kind === "special") {
    heading = resolved.page.title;
    if (resolved.page.sort === "clicks") {
      listings = [...listings].sort((a, b) => b.total_clicks - a.total_clicks);
    } else if (resolved.page.sort === "recent") {
      listings = [...listings].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">{heading}</h1>

        <div className="mt-6 space-y-3">
          <CategoryFilterBar active={resolved.kind === "category" ? resolved.category : undefined} />
          <CityFilterBar active={resolved.kind === "city" ? resolved.city : undefined} />
        </div>

        <div className="mt-8">
          <LeaderboardBoard listings={listings} />
        </div>
      </main>
      <Footer />
    </>
  );
}
