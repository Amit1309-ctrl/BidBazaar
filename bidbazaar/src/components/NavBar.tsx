import Link from "next/link";
import { IndianRupee } from "lucide-react";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-base-border/80 bg-base-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rupee/15 text-rupee">
            <IndianRupee size={16} strokeWidth={2.5} />
          </span>
          BidBazaar
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-secondary sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-ink-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/leaderboard#submit"
            className="rounded-pill bg-rupee px-4 py-2 text-sm font-semibold text-black transition hover:bg-rupee-bright"
          >
            Claim a spot
          </Link>
        </div>
      </div>
    </header>
  );
}
