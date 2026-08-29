"use client";

import { useState } from "react";
import { DEFAULT_BID_CONFIG } from "@/lib/bidding";
import { formatPaise } from "@/lib/format";
import { CATEGORY_LABELS, CITIES, type Category, type City } from "@/types";

const MIN = DEFAULT_BID_CONFIG.minimum_starting_bid_paise;

export function ClaimSpotForm() {
  const [amountRupees, setAmountRupees] = useState(String(MIN / 100));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "", website: "", founderName: "", email: "",
    category: "saas" as Category, city: CITIES[0],
  });

  const amountPaise = Math.round((Number(amountRupees) || 0) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amountPaise < MIN) {
      setError(`Starting bids must be at least ${formatPaise(MIN)}.`);
      return;
    }
    if (!form.companyName || !form.website || !form.founderName || !form.email) {
      setError("Please fill in every required field.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");
      // In production this hands off to Razorpay Checkout the same way
      // BidModal does — collapsed here since this is the "new listing"
      // entry point, not the outbid flow.
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div id="submit" className="rounded-card border border-rupee/30 bg-rupee-bg p-6 text-center">
        <p className="font-medium text-rupee-bright">Thanks — your listing was submitted for review.</p>
      </div>
    );
  }

  return (
    <form id="submit" onSubmit={handleSubmit} className="rounded-card border border-base-border bg-base-surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">Claim a spot</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Starting bids begin at {formatPaise(MIN)}. Your rank is set by where your bid lands against everyone else on
        the board.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Company / product name" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
        <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
        <Field label="Founder name" value={form.founderName} onChange={(v) => setForm({ ...form, founderName: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

        <label className="block">
          <span className="text-xs text-ink-secondary">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            className="mt-1 w-full rounded-card border border-base-border bg-base-elevated px-3 py-2 text-sm outline-none focus:border-rupee/50"
          >
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink-secondary">City</span>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value as City })}
            className="mt-1 w-full rounded-card border border-base-border bg-base-elevated px-3 py-2 text-sm outline-none focus:border-rupee/50"
          >
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs text-ink-secondary">Starting bid</span>
          <div className="mt-1 flex items-center gap-2 rounded-card border border-base-border bg-base-elevated px-3 py-2">
            <span className="text-ink-muted">₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full bg-transparent font-mono tabular-nums-mono outline-none"
            />
          </div>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-signal-down">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-pill bg-rupee py-3 text-sm font-semibold text-black transition hover:bg-rupee-bright disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit listing"}
      </button>
      <p className="mt-2 text-xs text-ink-muted">
        Listings are reviewed against our moderation guidelines before going live, even after payment succeeds.
      </p>
    </form>
  );
}

function Field({
  label, value, onChange, type = "text", className, maxLength,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; maxLength?: number }) {
  return (
    <label className={`block ${className ?? ""}`}>
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
