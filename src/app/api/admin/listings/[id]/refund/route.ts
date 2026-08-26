import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";
import { getRazorpayClient } from "@/lib/razorpay";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Not authorized." }, { status: guard.status });

  const { data: bid, error: fetchError } = await guard.admin
    .from("bids")
    .select("id, razorpay_payment_id, amount_paise, payment_status")
    .eq("id", params.id)
    .single();
  if (fetchError || !bid) return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  if (!bid.razorpay_payment_id) {
    return NextResponse.json({ error: "No captured payment on this bid to refund." }, { status: 400 });
  }

  const razorpay = getRazorpayClient();
  await razorpay.payments.refund(bid.razorpay_payment_id, { amount: bid.amount_paise });

  await guard.admin.from("bids").update({ payment_status: "refunded" }).eq("id", bid.id);
  await guard.admin
    .from("payments")
    .update({ status: "refunded" })
    .eq("bid_id", bid.id);

  await logAdminAction(guard.admin, guard.userId, "refund", "bids", bid.id);

  return NextResponse.redirect(new URL("/admin", req.url));
}
