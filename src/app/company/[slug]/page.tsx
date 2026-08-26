import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { CompanyLogo } from "@/components/CompanyLogo";
import { VerifiedBadge, RankNumber } from "@/components/badges";
import { CATEGORY_LABELS } from "@/types";
import { formatPaise, formatNumber } from "@/lib/format";
import { getListingBySlug } from "@/lib/data";
import { Share2, ExternalLink, Twitter, Linkedin } from "lucide-react";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const listing = await getListingBySlug(params.slug);
  if (!listing) return {};
  return {
    title: `${listing.company_name} — ${CATEGORY_LABELS[listing.category]} on BidBazaar`,
    description: listing.tagline,
    openGraph: {
      title: `${listing.company_name} on BidBazaar`,
      description: listing.tagline,
    },
  };
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const listing = await getListingBySlug(params.slug);
  if (!listing || listing.status !== "approved") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Leaderboard", item: "/leaderboard" },
      { "@type": "ListItem", position: 2, name: listing.company_name, item: `/company/${listing.slug}` },
    ],
  };

  return (
    <>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <Link href="/leaderboard" className="text-sm text-ink-muted hover:text-ink-secondary">← Leaderboard</Link>

        <div className="mt-4 flex items-start gap-4">
          <CompanyLogo name={listing.company_name} logoUrl={listing.logo_url} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{listing.company_name}</h1>
              {listing.verified && <VerifiedBadge />}
              <RankNumber rank={listing.current_rank ?? 0} />
            </div>
            <p className="mt-1 text-ink-secondary">{listing.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              <span>{CATEGORY_LABELS[listing.category]}</span>
              <span aria-hidden>·</span>
              <span>{listing.city}</span>
              {listing.founder_name && (<><span aria-hidden>·</span><span>Founded by {listing.founder_name}</span></>)}
            </div>
          </div>
        </div>

        {listing.description && (
          <p className="mt-6 leading-relaxed text-ink-secondary">{listing.description}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Current bid" value={formatPaise(listing.current_bid_paise)} />
          <Stat label="Highest rank ever" value={`#${listing.highest_rank_ever ?? listing.current_rank}`} />
          <Stat label="Total clicks" value={formatNumber(listing.total_clicks)} />
          <Stat label="Impressions" value={formatNumber(listing.total_impressions)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={`/go/${listing.slug}`}
            className="inline-flex items-center gap-1.5 rounded-pill bg-rupee px-4 py-2 text-sm font-semibold text-black hover:bg-rupee-bright"
          >
            Visit website <ExternalLink size={14} />
          </a>
          {listing.twitter_handle && (
            <a href={`https://x.com/${listing.twitter_handle}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1.5 rounded-pill border border-base-borderHover px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary">
              <Twitter size={14} /> @{listing.twitter_handle}
            </a>
          )}
          {listing.linkedin_url && (
            <a href={listing.linkedin_url} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1.5 rounded-pill border border-base-borderHover px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary">
              <Linkedin size={14} /> LinkedIn
            </a>
          )}
          <button className="inline-flex items-center gap-1.5 rounded-pill border border-base-borderHover px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary">
            <Share2 size={14} /> Share
          </button>
        </div>

        <div className="mt-10 rounded-card border border-base-border bg-base-surface p-5 text-sm text-ink-muted">
          Rank history and full bid history for {listing.company_name} render here from the
          <code className="mx-1 rounded bg-base-elevated px-1 py-0.5">rank_history</code> table — wire in a chart
          component (e.g. Recharts) reading <code className="rounded bg-base-elevated px-1 py-0.5">getRankHistory(listing.id)</code>.
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-base-border bg-base-surface p-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums-mono">{value}</div>
    </div>
  );
}
