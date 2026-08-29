import Link from "next/link";
import type { Listing } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { formatPaise, formatNumber } from "@/lib/format";
import { CompanyLogo } from "./CompanyLogo";
import { VerifiedBadge, MovementIndicator, RankNumber } from "./badges";

export function LeaderboardRow({
  listing,
  delta,
  onOutbid,
}: {
  listing: Listing;
  delta: number;
  onOutbid?: (listing: Listing) => void;
}) {
  return (
    <div className="group flex items-center gap-3 border-b border-base-border px-3 py-3.5 transition hover:bg-base-elevated/60 sm:gap-4 sm:px-4">
      <div className="w-9 shrink-0 text-center sm:w-11">
        <RankNumber rank={listing.current_rank ?? 0} />
      </div>

      <CompanyLogo name={listing.company_name} logoUrl={listing.logo_url} size={36} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <Link href={`/company/${listing.slug}`} className="inline-flex items-center gap-1.5">
          <span className="truncate font-medium group-hover:underline">{listing.company_name}</span>
          {listing.verified && <VerifiedBadge />}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-muted sm:hidden">
          <span>{CATEGORY_LABELS[listing.category]}</span>
          <span aria-hidden>·</span>
          <span>{listing.city}</span>
        </div>
      </div>

      <div className="hidden w-28 shrink-0 text-xs text-ink-muted md:block">
        {CATEGORY_LABELS[listing.category]}
      </div>
      <div className="hidden w-24 shrink-0 text-xs text-ink-muted lg:block">{listing.city}</div>

      <div className="hidden w-20 shrink-0 text-right text-xs tabular-nums-mono text-ink-secondary sm:block">
        {formatNumber(listing.total_clicks)}
      </div>

      <div className="w-16 shrink-0 sm:w-20">
        <MovementIndicator delta={delta} />
      </div>

      <div className="w-24 shrink-0 text-right font-mono text-sm font-semibold tabular-nums-mono sm:w-28">
        {formatPaise(listing.current_bid_paise)}
      </div>

      <button
        onClick={() => onOutbid?.(listing)}
        className="shrink-0 rounded-pill border border-base-borderHover px-3 py-1.5 text-xs font-semibold text-ink-secondary transition hover:border-rupee/50 hover:text-rupee-bright sm:px-4 sm:py-2 sm:text-sm"
      >
        Outbid
      </button>
    </div>
  );
}
