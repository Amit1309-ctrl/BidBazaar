"use client";

import { useMemo, useState } from "react";
import type { Listing } from "@/types";
import { ThroneCard } from "./ThroneCard";
import { LeaderboardRow } from "./LeaderboardRow";
import { BidModal } from "./BidModal";
import { minimumNextBid } from "@/lib/bidding";
import { formatPaise } from "@/lib/format";

export function LeaderboardBoard({ listings }: { listings: Listing[] }) {
  const [selected, setSelected] = useState<Listing | null>(null);

  const sorted = useMemo(
    () => [...listings].sort((a, b) => (a.current_rank ?? 999) - (b.current_rank ?? 999)),
    [listings]
  );
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div>
      {top3.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {top3.map((listing, i) => (
            <ThroneCard key={listing.id} listing={listing} tier={(i + 1) as 1 | 2 | 3} onOutbid={setSelected} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="overflow-hidden rounded-card border border-base-border">
          <div className="hidden items-center gap-3 border-b border-base-border bg-base-elevated/40 px-3 py-2.5 text-[11px] uppercase tracking-wide text-ink-muted sm:flex sm:px-4">
            <span className="w-9 sm:w-11">Rank</span>
            <span className="w-9" />
            <span className="flex-1">Company</span>
            <span className="hidden w-28 md:block">Category</span>
            <span className="hidden w-24 lg:block">City</span>
            <span className="hidden w-20 text-right sm:block">Clicks</span>
            <span className="w-16 sm:w-20">Trend</span>
            <span className="w-24 text-right sm:w-28">Bid</span>
            <span className="w-[76px] sm:w-[92px]" />
          </div>
          {rest.map((listing, i) => {
            const above = sorted[sorted.indexOf(listing) - 1];
            const gapToAbove = above ? minimumNextBid(listing.current_bid_paise) - above.current_bid_paise : null;
            return (
              <div key={listing.id}>
                <LeaderboardRow listing={listing} delta={0} onOutbid={setSelected} />
                {above && gapToAbove !== null && gapToAbove > 0 && (
                  <div className="border-b border-base-border bg-base-elevated/20 px-4 py-1.5 text-[11px] text-ink-muted sm:px-14">
                    {formatPaise(gapToAbove)} away from #{above.current_rank}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="rounded-card border border-dashed border-base-border py-16 text-center text-ink-muted">
          No listings yet — be the first to claim the board.
        </div>
      )}

      <BidModal listing={selected} listings={listings} onClose={() => setSelected(null)} />
    </div>
  );
}
