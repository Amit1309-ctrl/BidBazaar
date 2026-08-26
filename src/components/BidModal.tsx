"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Listing } from "@/types";
import { formatPaise } from "@/lib/format";
import { minimumNextBid } from "@/lib/bidding";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Step = "amount" | "details" | "summary" | "paying" | "success";

interface Props {
  listing: Listing | null;
  listings: Listing[]; // full board, to project new rank as the user types
  onClose: () => void;
}

export function BidModal({ listing, listings, onClose }: Props) {
  const [step, setStep] = useState<Step>("amount");
  const [amountRupees, setAmountRupees] = useState<string>("");
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    tagline: "",
    founderName: "",
    email: "",
    twitter: "",
    linkedin: "",
    city: "",
    promoCode: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setStep("amount");
      setError(null);
      const min = minimumNextBid(listing.current_bid_paise);
      setAmountRupees(String(Math.ceil(min / 100)));
      setForm((f) => ({
        ...f,
        companyName: listing.company_name,
        website: listing.website,
        tagline: listing.tagline,
        city: listing.city,
      }));
    }
  }, [listing]);

  const minimum = listing ? minimumNextBid(listing.current_bid_paise) : 0;
  const amountPaise = Math.round((Number(amountRupees) || 0) * 100);

  const projectedRank = useMemo(() => {
    if (!listing) return null;
    const others = listings.filter((l) => l.id !== listing.id);
    const better = others.filter((l) => l.current_bid_paise >= amountPaise).length;
    return better + 1;
  }, [listing, listings, amountPaise]);

  if (!listing) return null;

  function handleAmountNext() {
    if (amountPaise < minimum) {
      setError(`Minimum bid to overtake this position is ${formatPaise(minimum)}.`);
      return;
    }
    setError(null);
    setStep("details");
  }

  function handleDetailsNext() {
    if (!form.founderName || !form.email || !form.companyName) {
      setError("Founder name, email, and company name are required.");
      return;
    }
    setError(null);
    setStep("summary");
  }

  async function handlePay() {
    setStep("paying");
    setError(null);
    try {
      // 1. Create a Razorpay order server-side. The server re-validates
      //    the bid amount against the live current_bid_paise before
      //    creating the order — the amount in this request body is a
      //    hint, not the source of truth.
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          amountPaise,
          form,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Could not start payment.");

      // 2. Hand off to Razorpay Checkout. Loaded via <script> in
      //    layout — see README for the exact snippet.
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
        name: "BidBazaar",
        description: `Outbid for ${listing.company_name}`,
        order_id: order.razorpayOrderId,
        prefill: { name: form.founderName, email: form.email },
        theme: { color: "#17A673" },
        handler: async function () {
          // The checkout callback is a UX hint only. Rank is not updated
          // here — it's updated by the webhook handler after Razorpay's
          // server confirms the payment, then place_bid() runs under a
          // row lock. We just move to a "processing" state and poll.
          setStep("success");
        },
        modal: {
          ondismiss: () => setStep("summary"),
        },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setStep("summary");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-card border border-base-border bg-base-surface p-5 shadow-card sm:rounded-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted">Outbid</div>
            <h2 className="font-display text-lg font-semibold">{listing.company_name}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-muted hover:bg-base-elevated hover:text-ink-primary">
            <X size={18} />
          </button>
        </div>

        {step === "amount" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-card border border-base-border bg-base-elevated p-3 text-sm">
              <div>
                <div className="text-ink-muted">Current position</div>
                <div className="font-mono text-base font-semibold">#{listing.current_rank}</div>
              </div>
              <div>
                <div className="text-ink-muted">Current bid</div>
                <div className="font-mono text-base font-semibold">{formatPaise(listing.current_bid_paise)}</div>
              </div>
            </div>

            <label className="block">
              <span className="text-sm text-ink-secondary">Your bid</span>
              <div className="mt-1 flex items-center gap-2 rounded-card border border-base-border bg-base-elevated px-3 py-2.5 focus-within:border-rupee/50">
                <span className="text-ink-muted">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full bg-transparent font-mono text-lg tabular-nums-mono outline-none"
                />
              </div>
              <span className="mt-1 block text-xs text-ink-muted">
                Minimum bid: {formatPaise(minimum)}
              </span>
            </label>

            {projectedRank && (
              <div className="rounded-card border border-rupee/30 bg-rupee-bg px-3 py-2 text-sm text-rupee-bright">
                This bid would put you at <strong>#{projectedRank}</strong>
              </div>
            )}

            {error && <p className="text-sm text-signal-down">{error}</p>}

            <button
              onClick={handleAmountNext}
              className="w-full rounded-pill bg-rupee py-3 text-sm font-semibold text-black transition hover:bg-rupee-bright"
            >
              Continue
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-3">
            <TextField label="Company name" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
            <TextField label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
            <TextField label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} maxLength={140} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Founder name" value={form.founderName} onChange={(v) => setForm({ ...form, founderName: v })} />
              <TextField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="X / Twitter" value={form.twitter} onChange={(v) => setForm({ ...form, twitter: v })} />
              <TextField label="LinkedIn" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} />
            </div>
            <TextField label="Promo code (optional)" value={form.promoCode} onChange={(v) => setForm({ ...form, promoCode: v })} />

            {error && <p className="text-sm text-signal-down">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep("amount")} className="flex-1 rounded-pill border border-base-borderHover py-3 text-sm font-medium text-ink-secondary">
                Back
              </button>
              <button onClick={handleDetailsNext} className="flex-1 rounded-pill bg-rupee py-3 text-sm font-semibold text-black hover:bg-rupee-bright">
                Review
              </button>
            </div>
          </div>
        )}

        {step === "summary" && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-card border border-base-border bg-base-elevated p-4 text-sm">
              <SummaryLine label="Company" value={form.companyName} />
              <SummaryLine label="Bid amount" value={formatPaise(amountPaise)} />
              <SummaryLine label="Projected rank" value={`#${projectedRank}`} />
              <SummaryLine label="Payment method" value="UPI / Card / Netbanking / Wallet (Razorpay)" />
            </div>
            <p className="text-xs text-ink-muted">
              Your bid is only confirmed after payment is verified server-side. Paying increases your leaderboard
              placement — it does not guarantee traffic, leads, or sales. See{" "}
              <a href="/how-it-works" className="underline">how it works</a>.
            </p>
            {error && <p className="text-sm text-signal-down">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("details")} className="flex-1 rounded-pill border border-base-borderHover py-3 text-sm font-medium text-ink-secondary">
                Back
              </button>
              <button onClick={handlePay} className="flex-1 rounded-pill bg-rupee py-3 text-sm font-semibold text-black hover:bg-rupee-bright">
                Pay {formatPaise(amountPaise)}
              </button>
            </div>
          </div>
        )}

        {step === "paying" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="animate-spin text-rupee" size={28} />
            <p className="text-sm text-ink-secondary">Opening Razorpay checkout…</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rupee/15 text-rupee-bright">✓</div>
            <h3 className="font-display text-lg font-semibold">Payment received</h3>
            <p className="text-sm text-ink-secondary">
              We're confirming your payment and updating the leaderboard — this takes a few seconds. Refresh the
              leaderboard shortly to see your new rank.
            </p>
            <button onClick={onClose} className="mt-2 rounded-pill bg-rupee px-5 py-2.5 text-sm font-semibold text-black">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TextField({
  label, value, onChange, type = "text", maxLength,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-secondary">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-card border border-base-border bg-base-elevated px-3 py-2 text-sm outline-none focus:border-rupee/50"
      />
    </label>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink-primary">{value}</span>
    </div>
  );
}
