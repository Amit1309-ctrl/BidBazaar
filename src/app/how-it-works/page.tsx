import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { formatPaise } from "@/lib/format";
import { DEFAULT_BID_CONFIG } from "@/lib/bidding";

export const metadata = { title: "How it works" };

const cfg = DEFAULT_BID_CONFIG;

export default function HowItWorksPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">How it works</h1>
        <p className="mt-2 text-ink-secondary">
          hotbid is a public leaderboard. This page explains the mechanics plainly, with no fine print hidden
          elsewhere.
        </p>

        <Section title="How ranking works">
          <p>
            Every listing on the board has a current bid. Listings are ordered highest bid first. When two bids are
            equal, whichever was paid first ranks higher. There is no other ranking factor — no algorithmic boost,
            no editorial curation of order.
          </p>
        </Section>

        <Section title="Minimum bid and increments">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Minimum starting bid: {formatPaise(cfg.minimum_starting_bid_paise)}</li>
            <li>Every new bid must be at least ₹1 higher than the current bid.</li>
          </ul>
          <p className="mt-2 text-sm text-ink-muted">The starting bid is set by the platform admin.</p>
        </Section>

        <Section title="What your payment buys">
          <p>
            Payment secures your position on the leaderboard at the bid you paid, for as long as nobody outbids you.
            It does not buy a fixed placement duration, a guarantee against being outbid, or any promise of traffic,
            leads, or customers. Clicks and impressions are reported honestly from actual visitor activity — never
            padded.
          </p>
        </Section>

        <Section title="Refunds">
          <p>
            A successful, verified payment is generally non-refundable, since it immediately secures a leaderboard
            position. The exception is a payment reconciliation failure — for example, two people outbidding the
            same listing at the same instant — in which case the losing payment is automatically queued for refund.
          </p>
        </Section>

        <Section title="How traffic statistics are measured">
          <p>
            Every click on a listing&apos;s &quot;Visit website&quot; button passes through a tracking redirect that
            records the referrer, device category, and the listing&apos;s rank at the moment of the click, before
            forwarding the visitor to the advertiser&apos;s site. Automated and suspected-bot traffic is filtered out
            of public click counts.
          </p>
        </Section>

        <Section title="How listings are moderated">
          <p>
            Every listing is reviewed against our content guidelines before it goes live, even after payment
            succeeds — payment alone never bypasses moderation. Illegal businesses, scams, adult content, misleading
            investment schemes, phishing, malware, and hate or extremist content are not permitted. Anyone can report
            a listing; reported listings are reviewed by an admin.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-base-border pt-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-secondary">{children}</div>
    </section>
  );
}
