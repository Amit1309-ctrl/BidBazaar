import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase";
import { formatPaise, formatNumber } from "@/lib/format";
import { minimumNextBid } from "@/lib/bidding";
import type { Listing } from "@/types";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic"; // always reflects the signed-in user's own data

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-bold">Sign in to view your dashboard</h1>
          <p className="mt-2 text-ink-secondary">
            Founder dashboards are tied to the account that placed the bid. Sign in with the email you used at
            checkout to see your rank, clicks, and competitors.
          </p>
          <button className="mt-6 rounded-pill bg-rupee px-5 py-2.5 text-sm font-semibold text-black hover:bg-rupee-bright">
            Sign in with Google
          </button>
          <p className="mt-2 text-xs text-ink-muted">
            Auth UI wiring: Supabase Auth (Google OAuth + email magic link) — see README for setup.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const { data: companies } = await supabase.from("companies").select("id").eq("owner_id", user.id);
  const companyIds = (companies ?? []).map((c) => c.id);

  const { data: myListings } = await supabase
    .from("listings")
    .select("*")
    .in("company_id", companyIds.length ? companyIds : ["00000000-0000-0000-0000-000000000000"]);

  const listing = (myListings ?? [])[0] as Listing | undefined;

  if (!listing) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-bold">No listing yet</h1>
          <p className="mt-2 text-ink-secondary">You haven&apos;t claimed a spot on the board yet.</p>
          <Link href="/leaderboard#submit" className="mt-6 inline-block rounded-pill bg-rupee px-5 py-2.5 text-sm font-semibold text-black hover:bg-rupee-bright">
            Claim a spot
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  // Competitors ranked directly above this listing, and what it costs to
  // pass each one.
  const { data: above } = await supabase
    .from("listings")
    .select("company_name, slug, current_rank, current_bid_paise")
    .eq("status", "approved")
    .lt("current_rank", listing.current_rank ?? 0)
    .order("current_rank", { ascending: false })
    .limit(5);

  const ctr = listing.total_impressions > 0
    ? ((listing.total_clicks / listing.total_impressions) * 100).toFixed(1)
    : "—";

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">{listing.company_name}</h1>
        <p className="text-ink-secondary">Founder dashboard</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Current rank" value={`#${listing.current_rank}`} />
          <Stat label="Current bid" value={formatPaise(listing.current_bid_paise)} />
          <Stat label="Total clicks" value={formatNumber(listing.total_clicks)} />
          <Stat label="CTR" value={typeof ctr === "string" && ctr !== "—" ? `${ctr}%` : ctr} />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Competitors directly above you</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            The minimum bid needed to pass each one, based on current increment rules.
          </p>
          <div className="mt-4 overflow-hidden rounded-card border border-base-border">
            {(above ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-ink-muted">You&apos;re already #1 — nobody to overtake.</div>
            )}
            {(above ?? []).map((c) => (
              <div key={c.slug} className="flex items-center justify-between border-b border-base-border px-4 py-3 last:border-0">
                <div>
                  <div className="font-medium">#{c.current_rank} {c.company_name}</div>
                  <div className="text-xs text-ink-muted">Bid {formatPaise(c.current_bid_paise)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink-muted">Bid this to pass them</div>
                  <div className="font-mono font-semibold tabular-nums-mono">{formatPaise(minimumNextBid(c.current_bid_paise))}</div>
                </div>
              </div>
            ))}
          </div>
          {(above ?? []).length > 0 && (
            <Link href="/leaderboard" className="mt-4 inline-block rounded-pill bg-rupee px-5 py-2.5 text-sm font-semibold text-black hover:bg-rupee-bright">
              Move up
            </Link>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Historical rank</h2>
          <div className="mt-4 rounded-card border border-base-border bg-base-surface p-5 text-sm text-ink-muted">
            Rank-over-time chart renders here from the <code className="mx-1 rounded bg-base-elevated px-1 py-0.5">rank_history</code> table — wire in Recharts
            reading rows for <code className="mx-1 rounded bg-base-elevated px-1 py-0.5">listing_id = {listing.id.slice(0, 8)}…</code>.
          </div>
        </section>
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
