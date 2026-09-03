import type { MetadataRoute } from "next";
import { CITIES, PUBLIC_CATEGORY_LABELS } from "@/types";
import { getLeaderboard } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bidbazaar.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getLeaderboard();

  const staticRoutes = [
    "", "/leaderboard", "/how-it-works",
    "/top-this-week", "/most-clicked", "/biggest-movers", "/new",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "hourly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const categoryRoutes = Object.keys(PUBLIC_CATEGORY_LABELS).map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  const cityRoutes = CITIES.map((city) => ({
    url: `${SITE_URL}/${city.toLowerCase().replace(/\s+/g, "-")}`,
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  const companyRoutes = listings.map((l) => ({
    url: `${SITE_URL}/company/${l.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes, ...companyRoutes];
}
