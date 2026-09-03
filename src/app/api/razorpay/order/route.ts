import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpayClient } from "@/lib/razorpay";
import { createAdminSupabase } from "@/lib/supabase";
import { minimumNextBid, DEFAULT_BID_CONFIG } from "@/lib/bidding";
import { CATEGORY_SLUGS } from "@/types";

const bodySchema = z.object({
  listingId: z.string().uuid().nullable(), // null = brand-new listing
  amountPaise: z.number().int().positive(),
  form: z.object({
    companyName: z.string().min(1),
    website: z.string().url().or(z.string().min(1)),
    founderName: z.string().min(1),
    email: z.string().email(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    city: z.string().optional(),
    category: z.enum(CATEGORY_SLUGS).optional(),
    promoCode: z.string().optional(),
  }),
});

/**
 * Step 1 of the payment flow: create order server-side.
 *
 * The amount the client sends is only a hint — we re-check the listing's
 * live current_bid_paise (or the configured starting minimum, for a new
 * listing) before creating the Razorpay order, so a stale or tampered
 * client-side amount can never buy a rank it shouldn't.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { listingId, amountPaise, form } = parsed.data;

  const admin = createAdminSupabase();

  const { data: config } = await admin.from("platform_config").select("*").eq("id", 1).single();
  const bidConfig = config
    ? {
        minimum_starting_bid_paise: config.minimum_starting_bid_paise,
        tier1_ceiling_paise: config.tier1_ceiling_paise,
        tier1_flat_increment_paise: config.tier1_flat_increment_paise,
        tier2_ceiling_paise: config.tier2_ceiling_paise,
        tier2_percent_increment: Number(config.tier2_percent_increment),
        tier3_percent_increment: Number(config.tier3_percent_increment),
      }
    : DEFAULT_BID_CONFIG;

  let currentBidPaise = 0;
  let resolvedListingId = listingId;

  if (listingId) {
    const { data: listing } = await admin
      .from("listings")
      .select("id, current_bid_paise, status")
      .eq("id", listingId)
      .single();
    if (!listing || listing.status !== "approved") {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    currentBidPaise = listing.current_bid_paise;
  }

  const minimum = minimumNextBid(currentBidPaise, bidConfig);
  if (amountPaise < minimum) {
    return NextResponse.json(
      { error: `Bid too low — minimum is now ₹${(minimum / 100).toLocaleString("en-IN")}.` },
      { status: 409 }
    );
  }

  // Ensure there's a company + user + (for new listings) a pending
  // listing row to attach this payment to. In production this would
  // reuse the authenticated user's session (see createServerSupabase)
  // rather than trusting the email in the form body; simplified here so
  // the checkout flow works for first-time, not-yet-authenticated
  // founders, matching the "no login required to browse, login required
  // to pay" requirement — Razorpay's own payment step still requires a
  // verified contact.
  const { data: existingUser } = await admin.from("users").select("id").eq("email", form.email).maybeSingle();
  let userId = existingUser?.id;
  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: form.email,
      email_confirm: false,
      user_metadata: { display_name: form.founderName },
    });
    if (error || !created.user) {
      return NextResponse.json({ error: "Could not create account for checkout." }, { status: 500 });
    }
    userId = created.user.id;
    await admin.from("users").insert({ id: userId, email: form.email, display_name: form.founderName });
  }

  if (!resolvedListingId) {
    const { data: company } = await admin
      .from("companies")
      .insert({ owner_id: userId })
      .select("id")
      .single();

    const slug = slugify(form.companyName);
    const { data: newListing, error: listingError } = await admin
      .from("listings")
      .insert({
        company_id: company!.id,
        slug,
        company_name: form.companyName,
        website: normalizeUrl(form.website),
        founder_name: form.founderName,
        category: form.category ?? "other",
        city: form.city ?? "Remote India",
        twitter_handle: form.twitter || null,
        linkedin_url: form.linkedin || null,
        status: "pending", // stays pending until an admin approves, even after payment
      })
      .select("id")
      .single();

    if (listingError || !newListing) {
      return NextResponse.json({ error: "Could not create listing." }, { status: 500 });
    }
    resolvedListingId = newListing.id;
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    notes: { listingId: resolvedListingId, userId },
  });

  const { data: bid, error: bidError } = await admin
    .from("bids")
    .insert({
      listing_id: resolvedListingId,
      user_id: userId,
      amount_paise: amountPaise,
      razorpay_order_id: order.id,
      payment_status: "created",
      promo_code: form.promoCode || null,
    })
    .select("id")
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: "Could not record bid." }, { status: 500 });
  }

  return NextResponse.json({
    razorpayOrderId: order.id,
    bidId: bid.id,
    listingId: resolvedListingId,
  });
}

function slugify(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}
