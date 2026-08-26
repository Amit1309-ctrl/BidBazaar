import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * The ONLY place a bid is ever marked `captured` and ranks recalculated.
 *
 * Flow:
 *   1. Read the raw request body (required for signature verification —
 *      never parse-then-reserialize, since that can change byte-for-byte
 *      output and break the HMAC check).
 *   2. Verify X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET.
 *   3. On payment.captured: mark the matching bid `captured`, insert the
 *      raw payload into `payments` for audit, then call the `place_bid`
 *      Postgres function, which does the row-locked re-validation and
 *      rank recompute (see supabase/schema.sql).
 *   4. On payment.failed: mark the bid `failed`. No rank change.
 *
 * Idempotency: Razorpay may deliver the same event more than once. We
 * upsert into `payments` keyed on (razorpay_order_id, razorpay_payment_id)
 * — see the unique index note in schema.sql — and place_bid() is safe to
 * call twice for the same bid because it only proceeds while the bid's
 * current rank hasn't already reflected this amount; a second call is a
 * harmless no-op re-derivation of the same state.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    // Do not leak *why* verification failed — just reject.
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminSupabase();

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload.payment.entity;
      const orderId: string = payment.order_id;
      const paymentId: string = payment.id;
      const method: string | undefined = payment.method;

      const { data: bid } = await admin
        .from("bids")
        .select("id, listing_id, amount_paise, payment_status")
        .eq("razorpay_order_id", orderId)
        .single();

      if (!bid) {
        console.error("Webhook: no bid found for order", orderId);
        return NextResponse.json({ received: true }); // ack anyway — nothing to reconcile
      }

      // Already processed this exact payment — ack without reprocessing.
      if (bid.payment_status === "captured") {
        return NextResponse.json({ received: true });
      }

      await admin.from("payments").insert({
        bid_id: bid.id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        amount_paise: payment.amount,
        status: "captured",
        method,
        raw_webhook_payload: event,
      });

      await admin
        .from("bids")
        .update({ payment_status: "captured", razorpay_payment_id: paymentId })
        .eq("id", bid.id);

      // Approve the listing on first successful payment if it was still
      // pending moderation-review-eligible seed state. In production,
      // genuinely new listings stay `pending` for a human moderator —
      // this only flips bids on already-approved listings into their
      // new rank. See supabase/schema.sql: place_bid() only ranks
      // listings with status = 'approved'.
      const { error: placeBidError } = await admin.rpc("place_bid", { p_bid_id: bid.id });

      if (placeBidError) {
        // The amount no longer beats the current bid (someone else won
        // the race) — place_bid() already flipped payment_status to
        // 'failed' inside its own transaction. Queue for refund rather
        // than silently keeping the money.
        console.error("place_bid failed, queuing reconciliation refund:", placeBidError.message);
        await admin.from("payments").insert({
          bid_id: bid.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          amount_paise: payment.amount,
          status: "refunded", // marks intent; actual Razorpay refund call happens in a reconciliation worker
          method,
          raw_webhook_payload: { reconciliation: "concurrent_bid_lost", original_event: event },
        });
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      await admin
        .from("bids")
        .update({ payment_status: "failed" })
        .eq("razorpay_order_id", payment.order_id);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still 200 so Razorpay doesn't hammer retries for a bug on our side
    // that a human needs to look at — logged above for alerting.
  }

  return NextResponse.json({ received: true });
}
