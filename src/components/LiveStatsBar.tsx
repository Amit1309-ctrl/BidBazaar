import type { LiveStats, ActivityEvent } from "@/types";
import { formatPaiseCompact, formatCompactNumber, formatDurationSince } from "@/lib/format";
import { TrendingUp, Zap } from "lucide-react";

export function LiveStatsBar({ stats }: { stats: LiveStats }) {
  const items = [
    { label: "in bids", value: formatPaiseCompact(stats.total_bids_paise) },
    { label: "companies", value: formatCompactNumber(stats.total_companies) },
    { label: "clicks delivered", value: formatCompactNumber(stats.total_clicks) },
    { label: "bids today", value: formatCompactNumber(stats.bids_today) },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-1.5">
          <span className="font-mono font-semibold tabular-nums-mono text-ink-primary">{it.value}</span>
          <span className="text-ink-muted">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="rounded-card border border-base-border bg-base-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Zap size={13} className="text-rupee" /> Live activity
      </div>
      <ul className="space-y-2.5">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-2 text-sm">
            <TrendingUp size={14} className="mt-0.5 shrink-0 text-ink-muted" />
            <span className="text-ink-secondary">
              <a href={`/company/${e.listing_slug}`} className="font-medium text-ink-primary hover:underline">
                {e.listing_name}
              </a>{" "}
              {e.detail}
              <span className="ml-2 text-xs text-ink-muted">{formatDurationSince(e.created_at)} ago</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
