import Link from "next/link";
import { Crown } from "lucide-react";
import type { Listing } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { formatPaise, formatNumber, formatDurationSince } from "@/lib/format";
import { CompanyLogo } from "./CompanyLogo";
import { VerifiedBadge } from "./badges";
import { cn } from "@/lib/cn";

const TIER_STYLES = {
  1: {
    wrap: "border-gold/40 bg-gradient-to-b from-gold/[0.08] to-transparent shadow-goldGlow md:col-span-3",
    ring: "ring-2 ring-gold/50",
    label: "text-gold",
    logoSize: 64,
  },
  2: {
    wrap: "border-silver/30 bg-gradient-to-b from-silver/[0.05] to-transparent",
    ring: "ring-1 ring-silver/40",
    label: "text-silver",
    logoSize: 52,
  },
  3: {
    wrap: "border-bronze/30 bg-gradient-to-b from-bronze/[0.05] to-transparent",
    ring: "ring-1 ring-bronze/40",
    label: "text-bronze",
    logoSize: 52,
  },
} as const;

export function ThroneCard({
  listing,
  tier,
  onOutbid,
}: {
  listing: Listing;
  tier: 1 | 2 | 3;
  onOutbid?: (listing: Listing) => void;
}) {
  const style = TIER_STYLES[tier];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card border p-5 transition sm:p-6",
        style.wrap
      )}
    >
      {tier === 1 && (
        <div className="pointer-events-none absolute inset-0 animate-pulseGlow bg-[radial-gradient(ellipse_at_top,rgba(232,181,74,0.12),transparent_60%)]" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-[12px]", style.ring)}>
            <CompanyLogo name={listing.company_name} logoUrl={listing.logo_url} size={style.logoSize} />
          </div>
          <div>
            <div className={cn("font-display text-2xl font-bold tabular-nums-mono", style.label)}>
              #{tier}
            </div>
            {tier === 1 && (
              <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gold/80">
                <Crown size={12} /> King of the Bazaar
              </div>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-ink-muted">
          held for<br />
          <span className="tabular-nums-mono text-ink-secondary">{formatDurationSince(listing.rank_since)}</span>
        </div>
      </div>

      <div className="relative mt-4">
        <Link href={`/company/${listing.slug}`} className="group/name inline-flex items-center gap-1.5">
          <h3 className="font-display text-xl font-semibold group-hover/name:underline sm:text-2xl">
            {listing.company_name}
          </h3>
          {listing.verified && <VerifiedBadge />}
        </Link>
        <p className="mt-1 text-sm text-ink-secondary">{listing.tagline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span>{CATEGORY_LABELS[listing.category]}</span>
          <span aria-hidden>·</span>
          <span>{listing.city}</span>
          <span aria-hidden>·</span>
          <span>{formatNumber(listing.total_clicks)} clicks</span>
        </div>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">Current bid</div>
          <div className="font-mono text-2xl font-semibold tabular-nums-mono">
            {formatPaise(listing.current_bid_paise)}
          </div>
        </div>
        <button
          onClick={() => onOutbid?.(listing)}
          className="rounded-pill border border-rupee/40 bg-rupee/10 px-4 py-2 text-sm font-semibold text-rupee-bright transition hover:bg-rupee/20"
        >
          Outbid
        </button>
      </div>
    </div>
  );
}
