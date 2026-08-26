import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase";
import { formatPaise, formatNumber } from "@/lib/format";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-bold">Not authorized</h1>
          <p className="mt-2 text-ink-secondary">This account doesn&apos;t have admin access.</p>
        </main>
        <Footer />
      </>
    );
  }

  // Admin reads use the service-role client — RLS intentionally has no
  // policy granting broad reads, so admin-only queries always go through
  // this server-only client rather than loosening RLS for everyone.
  const admin = createAdminSupabase();

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1);

  const [{ data: bidsToday }, { data: bidsWeek }, { data: bidsMonth }, { data: allCaptured }, { data: reports }, { data: pending }] =
    await Promise.all([
      admin.from("bids").select("amount_paise").eq("payment_status", "captured").gte("created_at", startOfToday.toISOString()),
      admin.from("bids").select("amount_paise").eq("payment_status", "captured").gte("created_at", startOfWeek.toISOString()),
      admin.from("bids").select("amount_paise").eq("payment_status", "captured").gte("created_at", startOfMonth.toISOString()),
      admin.from("bids").select("amount_paise").eq("payment_status", "captured"),
      admin.from("reports").select("id, listing_id, reason, status, created_at").eq("status", "open").limit(20),
      admin.from("listings").select("id, company_name, slug, category, city, created_at").eq("status", "pending").limit(20),
    ]);

  const sum = (rows: { amount_paise: number }[] | null) => (rows ?? []).reduce((s, r) => s + r.amount_paise, 0);
  const avgBid = allCaptured && allCaptured.length ? sum(allCaptured) / allCaptured.length : 0;
  const topBid = allCaptured && allCaptured.length ? Math.max(...allCaptured.map((r) => r.amount_paise)) : 0;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Admin</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Revenue today" value={formatPaise(sum(bidsToday))} />
          <Stat label="Revenue this week" value={formatPaise(sum(bidsWeek))} />
          <Stat label="Revenue this month" value={formatPaise(sum(bidsMonth))} />
          <Stat label="Lifetime revenue" value={formatPaise(sum(allCaptured))} />
          <Stat label="Total bids" value={formatNumber(allCaptured?.length ?? 0)} />
          <Stat label="Average bid" value={formatPaise(avgBid)} />
          <Stat label="Top bid" value={formatPaise(topBid)} />
          <Stat label="Open reports" value={formatNumber(reports?.length ?? 0)} />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Pending moderation ({pending?.length ?? 0})</h2>
          <div className="mt-4 overflow-hidden rounded-card border border-base-border">
            {(pending ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-ink-muted">Nothing waiting on review.</div>
            )}
            {(pending ?? []).map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b border-base-border px-4 py-3 last:border-0">
                <div>
                  <div className="font-medium">{l.company_name}</div>
                  <div className="text-xs text-ink-muted">{l.category} · {l.city} · /{l.slug}</div>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/admin/listings/${l.id}/approve`} method="post">
                    <button className="rounded-pill bg-rupee px-3 py-1.5 text-xs font-semibold text-black">Approve</button>
                  </form>
                  <form action={`/api/admin/listings/${l.id}/ban`} method="post">
                    <button className="rounded-pill border border-signal-down/40 px-3 py-1.5 text-xs font-semibold text-signal-down">Ban</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Open reports ({reports?.length ?? 0})</h2>
          <div className="mt-4 overflow-hidden rounded-card border border-base-border">
            {(reports ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-ink-muted">No open reports.</div>
            )}
            {(reports ?? []).map((r) => (
              <div key={r.id} className="border-b border-base-border px-4 py-3 text-sm last:border-0">
                <div className="font-medium">{r.reason}</div>
                <div className="text-xs text-ink-muted">listing {r.listing_id.slice(0, 8)}… · {new Date(r.created_at).toLocaleDateString("en-IN")}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-card border border-base-border bg-base-surface p-5 text-sm text-ink-muted">
          Bid-rule config (minimum bid, increments, category/promo-code management, refunds, and the full audit
          log view) reads and writes <code className="mx-1 rounded bg-base-elevated px-1 py-0.5">platform_config</code>,{" "}
          <code className="mx-1 rounded bg-base-elevated px-1 py-0.5">promo_codes</code>, and{" "}
          <code className="mx-1 rounded bg-base-elevated px-1 py-0.5">admin_actions</code> the same way this page reads bids and
          reports — extend this page with a form per table as the next iteration.
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-base-border bg-base-surface p-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-0.5 font-mono text-base font-semibold tabular-nums-mono">{value}</div>
    </div>
  );
}
