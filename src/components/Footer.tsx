import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-base-border">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-muted sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <div className="font-display font-semibold text-ink-secondary">BidBazaar</div>
            <p className="mt-1 max-w-xs">India&apos;s competitive startup leaderboard. Bid, rank, get seen.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <FooterLinks title="Explore" links={[
              ["Leaderboard", "/leaderboard"],
              ["Top this week", "/top-this-week"],
              ["Most clicked", "/most-clicked"],
              ["Biggest movers", "/biggest-movers"],
              ["New", "/new"],
            ]} />
            <FooterLinks title="Company" links={[
              ["How it works", "/how-it-works"],
              ["Dashboard", "/dashboard"],
            ]} />
          </div>
        </div>
        <p className="mt-8 text-xs">
          © {new Date().getFullYear()} BidBazaar. Paying for placement increases leaderboard visibility only — it
          does not guarantee traffic, leads, or sales.
        </p>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted/80">{title}</div>
      <ul className="space-y-1.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-ink-secondary">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
