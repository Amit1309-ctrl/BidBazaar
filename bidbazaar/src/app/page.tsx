import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { CompanyLogo } from "@/components/CompanyLogo";
import { LiveStatsBar, ActivityFeed } from "@/components/LiveStatsBar";
import { VerifiedBadge } from "@/components/badges";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { LeaderboardBoard } from "@/components/LeaderboardBoard";
import { getLeaderboard, getLiveStats, getRecentActivity } from "@/lib/data";
import { formatPaise, formatDurationSince } from "@/lib/format";

export const revalidate = 30; // leaderboard reads are cached at the edge, refreshed every 30s

export default async function HomePage() {
  const [listings, stats, activity] = await Promise.all([
    getLeaderboard({ limit: 10 }),
    getLiveStats(),
    getRecentActivity(6),
  ]);

  const champion = listings[0];
  const nextMinBid = champion ? Math.ceil((champion.current_bid_paise * 1.05) / 100) : 4990;

  return (
    <>
      <NavBar />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        {/* ---- Hero: the live #1 listing IS the thesis ---- */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-pill border border-base-border bg-base-surface px-3 py-1 text-xs text-ink-secondary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rupee-bright" />
              Live leaderboard · updates on every winning bid
            </div>

            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              India&apos;s most competitive
              <br />
              <span className="text-rupee-bright">startup billboard.</span>
            </h1>

            <p className="mt-4 max-w-md text-ink-secondary">
              One public leaderboard. Founders bid for rank, the highest bid takes the top spot, and anyone can
              outbid them tomorrow. Bid, rank, get seen.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/leaderboard#submit"
                className="inline-flex items-center gap-1.5 rounded-pill bg-rupee px-5 py-3 text-sm font-semibold text-black transition hover:bg-rupee-bright"
              >
                Claim the #1 spot <ArrowRight size={16} />
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-pill border border-base-borderHover px-5 py-3 text-sm font-medium text-ink-secondary transition hover:text-ink-primary"
              >
                View leaderboard
              </Link>
            </div>

            <div className="mt-10">
              <LiveStatsBar stats={stats} />
            </div>
          </div>

          {/* Current #1 — the hero visual */}
          <div>
            {champion ? (
              <div className="relative overflow-hidden rounded-card border border-gold/40 bg-gradient-to-b from-gold/[0.08] to-transparent p-6 shadow-goldGlow sm:p-8">
                <div className="pointer-events-none absolute inset-0 animate-pulseGlow bg-[radial-gradient(ellipse_at_top,rgba(232,181,74,0.14),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                    <Crown size={13} /> Currently #1
                  </span>
                  <span className="text-xs text-ink-muted">
                    held for <span className="tabular-nums-mono text-ink-secondary">{formatDurationSince(champion.rank_since)}</span>
                  </span>
                </div>

                <div className="relative mt-6 flex items-center gap-4">
                  <CompanyLogo name={champion.company_name} logoUrl={champion.logo_url} size={64} className="ring-2 ring-gold/50" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display text-2xl font-bold">{champion.company_name}</h2>
                      {champion.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-sm text-ink-secondary">{champion.tagline}</p>
                  </div>
                </div>

                <div className="relative mt-7 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-muted">Winning bid</div>
                    <div className="font-mono text-3xl font-bold tabular-nums-mono">
                      {formatPaise(champion.current_bid_paise)}
                    </div>
                  </div>
                  <Link
                    href="/leaderboard#submit"
                    className="rounded-pill border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20"
                  >
                    Take #1 — from ₹{nextMinBid.toLocaleString("en-IN")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-base-border p-10 text-center text-ink-secondary">
                The board is empty. Be the first name on it.
              </div>
            )}
          </div>
        </section>

        {/* ---- Categories ---- */}
        <section className="mt-16">
          <CategoryFilterBar />
        </section>

        {/* ---- Leaderboard preview + activity ---- */}
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Top 10 right now</h2>
              <Link href="/leaderboard" className="text-sm text-rupee-bright hover:underline">
                Full leaderboard →
              </Link>
            </div>
            <LeaderboardBoard listings={listings} />
          </div>
          <div className="space-y-4">
            <ActivityFeed events={activity} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
