import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Server-only Razorpay client. Never import this from a Client Component —
 * the key secret must never reach the browser bundle.
 */
export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured.");
  }
  return new Razorpay({ key_id, key_secret });
}

/**
 * Verifies the signature returned by Razorpay Checkout after a payment
 * completes client-side. This is NOT sufficient on its own to mark a bid
 * as paid — always additionally trust the async webhook (see
 * /api/razorpay/webhook), since the checkout callback can be spoofed or
 * dropped by a flaky client. Client-side "success" is a hint, never proof.
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, params.signature);
}

/**
 * Verifies the X-Razorpay-Signature header on an incoming webhook payload.
 * This is the authoritative check — a bid is only ever marked `captured`
 * after this passes, server-side, against the raw request body.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signatureHeader);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
