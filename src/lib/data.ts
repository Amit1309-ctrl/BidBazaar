import { createClient } from "@supabase/supabase-js";
import type { Listing, LiveStats, ActivityEvent, Category, City } from "@/types";

/**
 * Read-only anon client for public Server Component data fetching.
 * Approved listings are readable by anyone per the RLS policy in
 * supabase/schema.sql, so this never needs a session or the service key.
 */
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getLeaderboard(opts?: {
  category?: Category;
  city?: City;
  limit?: number;
}): Promise<Listing[]> {
  const sb = publicClient();
  let query = sb
    .from("listings")
    .select("*")
    .eq("status", "approved")
    .order("current_bid_paise", { ascending: false })
    .order("created_at", { ascending: true });

  if (opts?.category) query = query.eq("category", opts.category);
  if (opts?.city) query = query.eq("city", opts.city);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    console.error("getLeaderboard error", error);
    return [];
  }
  return data as Listing[];
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const sb = publicClient();
  const { data, error } = await sb.from("listings").select("*").eq("slug", slug).single();
  if (error) return null;
  return data as Listing;
}

export async function getLiveStats(): Promise<LiveStats> {
  const sb = publicClient();

  const [{ data: listings }, { count: bidsToday }] = await Promise.all([
    sb.from("listings").select("current_bid_paise, total_clicks").eq("status", "approved"),
    sb
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "captured")
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const rows = listings ?? [];
  return {
    total_bids_paise: rows.reduce((sum, r) => sum + (r.current_bid_paise ?? 0), 0),
    total_companies: rows.length,
    total_clicks: rows.reduce((sum, r) => sum + (r.total_clicks ?? 0), 0),
    bids_today: bidsToday ?? 0,
  };
}

/**
 * Derives a lightweight activity feed from recent captured bids + rank
 * history, rather than a separate mutable "events" table — one less place
 * for state to drift out of sync with what actually happened.
 */
export async function getRecentActivity(limit = 12): Promise<ActivityEvent[]> {
  const sb = publicClient();
  const { data, error } = await sb
    .from("bids")
    .select("id, amount_paise, previous_rank, new_rank, created_at, listings(slug, company_name)")
    .eq("payment_status", "captured")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((bid: any): ActivityEvent => {
    const name = bid.listings?.company_name ?? "A company";
    const slug = bid.listings?.slug ?? "";
    let kind: ActivityEvent["kind"] = "new_bid";
    let detail = `bid ₹${Math.round(bid.amount_paise / 100).toLocaleString("en-IN")}`;

    if (bid.new_rank === 1 && bid.previous_rank !== 1) {
      kind = "took_first";
      detail = "took the #1 spot";
    } else if (bid.new_rank <= 10 && bid.previous_rank > 10) {
      kind = "entered_top10";
      detail = "entered the Top 10";
    } else if (bid.previous_rank && bid.new_rank && bid.new_rank < bid.previous_rank) {
      kind = "moved_up";
      detail = `moved from #${bid.previous_rank} → #${bid.new_rank}`;
    }

    return {
      id: bid.id,
      kind,
      listing_slug: slug,
      listing_name: name,
      detail,
      created_at: bid.created_at,
    };
  });
}
