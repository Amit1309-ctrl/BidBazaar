/**
 * Formatting helpers tuned for the Indian market.
 * Money is always stored and passed around as integer paise (never floats).
 */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1250000 (paise) -> "₹12,500" using Indian digit grouping (lakh/crore). */
export function formatPaise(paise: number): string {
  return inr.format(Math.round(paise / 100));
}

/** Compact form for big aggregate numbers, e.g. "₹18.4L" style stats. */
export function formatPaiseCompact(paise: number): string {
  const rupees = Math.round(paise / 100);
  if (rupees >= 1_00_00_000) return `₹${(rupees / 1_00_00_000).toFixed(1)}Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(1)}L`;
  return inr.format(rupees);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function formatCompactNumber(n: number): string {
  return inrCompact.format(n);
}

/** "6h 42m" style duration since a given ISO timestamp. */
export function formatDurationSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
