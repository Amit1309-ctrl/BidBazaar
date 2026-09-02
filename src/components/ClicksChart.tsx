"use client";

import { useMemo, useState } from "react";

type Range = 7 | 30 | 365;

export function ClicksChart({ clickDates }: { clickDates: string[] }) {
  const [range, setRange] = useState<Range>(30);
  const data = useMemo(() => buildDailyData(clickDates, range), [clickDates, range]);
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const max = Math.max(...data.map((point) => point.count), 1);
  const width = 700;
  const height = 180;
  const padding = 12;
  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (point.count / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="mt-10 rounded-card border border-base-border bg-base-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Clicks over time</h2>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums-mono">{total}</div>
          <p className="text-xs text-ink-muted">clicks in the selected period</p>
        </div>
        <div className="flex rounded-pill border border-base-border p-1 text-xs">
          {([7, 30, 365] as Range[]).map((days) => (
            <button
              key={days}
              onClick={() => setRange(days)}
              className={`rounded-pill px-3 py-1.5 ${range === days ? "bg-rupee text-black" : "text-ink-secondary"}`}
            >
              {days === 365 ? "12 months" : `${days} days`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Clicks over time line chart">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-base-border" />
          <polyline points={points} fill="none" stroke="#17A673" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className="flex justify-between text-xs text-ink-muted">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    </section>
  );
}

function buildDailyData(clickDates: string[], range: Range) {
  const counts = new Map<string, number>();
  clickDates.forEach((date) => {
    const key = new Date(date).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const today = new Date();
  return Array.from({ length: range }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (range - 1 - index));
    const key = day.toISOString().slice(0, 10);
    return {
      count: counts.get(key) ?? 0,
      label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  });
}
