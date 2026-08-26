import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Every outbound click to an advertiser's site passes through here first.
 * Records the click (for CTR analytics) then 302s onward with UTM params.
 * Deliberately does not read anything more identifying than a coarse
 * device category — no fingerprinting, no raw IP storage.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = createAdminSupabase();

  const { data: listing } = await admin
    .from("listings")
    .select("id, website, current_rank, status")
    .eq("slug", params.slug)
    .single();

  if (!listing || listing.status !== "approved") {
    return NextResponse.redirect(new URL("/leaderboard", req.url));
  }

  const ua = req.headers.get("user-agent") ?? "";
  const deviceCategory = /mobile/i.test(ua) ? "mobile" : /tablet|ipad/i.test(ua) ? "tablet" : "desktop";
  const isSuspectedBot = /bot|crawler|spider|headless/i.test(ua);

  await admin.from("click_events").insert({
    listing_id: listing.id,
    referrer: req.headers.get("referer") ?? null,
    utm_campaign: `rank_${listing.current_rank ?? "unranked"}`,
    device_category: deviceCategory,
    rank_at_click: listing.current_rank,
    is_suspected_bot: isSuspectedBot,
  });

  if (!isSuspectedBot) {
    await admin.rpc("increment_listing_clicks", { p_listing_id: listing.id }).single().then(
      () => {},
      // increment_listing_clicks is a tiny SQL helper (see README) —
      // `total_clicks = total_clicks + 1` guarded by the same row lock
      // pattern as place_bid(). Falls through quietly if not yet created
      // so this route still works during initial setup.
      () => {}
    );
  }

  const target = new URL(listing.website);
  target.searchParams.set("utm_source", "bidbazaar");
  target.searchParams.set("utm_medium", "leaderboard");
  target.searchParams.set("utm_campaign", `rank_${listing.current_rank ?? "unranked"}`);

  return NextResponse.redirect(target, { status: 302 });
}
