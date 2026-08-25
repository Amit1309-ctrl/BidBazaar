import { ArrowUp, ArrowDown, Minus, BadgeCheck, Crown } from "lucide-react";
import { cn } from "@/lib/cn";

export function MovementIndicator({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
        <Minus size={12} /> steady
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums-mono",
        up ? "text-signal-up" : "text-signal-down"
      )}
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(delta)} {up ? "up" : "down"}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span
      title="Verified company"
      className="inline-flex items-center text-rupee-bright"
    >
      <BadgeCheck size={15} strokeWidth={2.5} />
    </span>
  );
}

export function RankTierBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
        <Crown size={13} /> Top of the Bazaar
      </span>
    );
  }
  return null;
}

export function RankNumber({ rank }: { rank: number }) {
  const tier =
    rank === 1 ? "text-gold" : rank === 2 ? "text-silver" : rank === 3 ? "text-bronze" : "text-ink-muted";
  return <span className={cn("font-display tabular-nums-mono text-lg font-bold", tier)}>#{rank}</span>;
}
