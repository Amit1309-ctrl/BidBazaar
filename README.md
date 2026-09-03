# hotbid

India's competitive startup leaderboard. Founders pay to rank; anyone can outbid them tomorrow.

Inspired by the *paid-leaderboard* mechanic popularized by outbid.lol, but built from scratch with
an original brand, visual identity, copy, and codebase — nothing here is copied from that product.

**Positioning:** *India's most competitive startup billboard. Bid. Rank. Get noticed.*

---

## 1. Core user journey

```
DISCOVER → COMPETE → BID → MOVE UP → GET SEEN → SHARE → GET OUTBID → RETURN
```

1. A visitor lands on the homepage and sees the live #1 listing within the first 5 seconds.
2. They browse the leaderboard, filter by category/city, and open a company's public page.
3. A founder decides to compete: they either claim a fresh spot (`/leaderboard#submit`) or
   outbid an existing listing (the "Outbid" button on any row/throne card).
4. The bid modal shows current position → their proposed bid → minimum required → projected
   new rank, then collects company details and hands off to Razorpay Checkout.
5. Razorpay's webhook (never the client-side callback) confirms payment server-side and calls
   the `place_bid()` Postgres function, which re-validates the bid under a row lock and
   recomputes ranks atomically.
6. The founder gets a dashboard showing their rank, CTR, and exactly how much it costs to pass
   each competitor above them.
7. They share their new rank (dynamic OG image, WhatsApp/X/LinkedIn share).
8. Someone outbids them. They come back to reclaim the spot.

## 2. Database architecture

See `supabase/schema.sql` for the full, commented schema. Summary of tables:

| Table | Purpose |
|---|---|
| `users` | Public profile mirroring `auth.users` |
| `companies` | Founder-owned entity; one company can hold one listing |
| `listings` | The public leaderboard row — denormalized `current_bid_paise`/`current_rank` for fast reads |
| `bids` | One row per bid attempt (successful or not); append-only |
| `payments` | Raw Razorpay transaction records, keyed for webhook idempotency |
| `click_events` | Every `/go/[slug]` redirect click, for CTR analytics |
| `impressions` | Listing impressions per surface |
| `rank_history` | Append-only rank snapshots, written only by `place_bid()` |
| `categories`, `promo_codes`, `reports`, `admin_actions`, `platform_config` | Supporting/admin tables |

**Concurrency safety.** All rank/price mutation goes through the `place_bid(p_bid_id)` SQL
function, which:
1. Locks the target listing row (`for update`).
2. Re-reads the live `current_bid_paise` under that lock.
3. Rejects the bid (and marks it `failed`, ready for refund reconciliation) if a concurrent bid
   already beat it.
4. Recomputes every approved listing's rank in one `update ... from (ranked cte)` pass.
5. Appends a `rank_history` row.

This is the only code path that can change a listing's rank — never called from a client-trusted
"payment succeeded" callback, only from the Razorpay webhook handler after signature verification
and after Razorpay's own `payment.captured` event.

Money is stored as `bigint` paise everywhere. No floats touch currency.

## 3. Page architecture

```
/                        Homepage — live #1 hero, stats, leaderboard preview, activity feed
/leaderboard              Full leaderboard + filters + "claim a spot" form
/[slug]                   Smart discovery route — resolves to a category, city, or special
                           sort page: /ai /saas /ecommerce ... /bengaluru /mumbai ...
                           /top-this-week /most-clicked /biggest-movers /new
/company/[slug]            Public, SEO-indexed company page + dynamic OG share image
/how-it-works              Transparency page (bidding rules, refunds, moderation, measurement)
/dashboard                 Founder dashboard — rank, CTR, competitors above + cost to pass them
/admin                     Revenue, moderation queue, reports, audit trail
/go/[slug]                 Click-tracking redirect → advertiser site with UTM params
/auth/callback              Supabase Auth (magic link + Google OAuth) redirect handler
/api/razorpay/order          Creates a Razorpay order, re-validating bid amount server-side
/api/razorpay/webhook         Authoritative payment confirmation → place_bid()
/api/admin/listings/[id]/*    approve / suspend / ban / refund (all behind requireAdmin())
```

## 4. MVP scope (what's implemented vs. scaffolded)

**Fully implemented:**
- Schema, RLS, and the concurrency-safe `place_bid()` function
- Homepage, leaderboard, category/city/discovery pages, public company pages
- Bid modal (outbid flow) and claim-a-spot form (new listing flow)
- Razorpay order creation with server-side re-validation
- Razorpay webhook with signature verification, idempotency, and reconciliation-on-conflict
- Click-tracking redirect with UTM params and bot filtering
- Admin approve/suspend/ban/refund actions, all behind a server-side admin check
- Founder dashboard (rank, CTR, competitors-above with cost-to-pass)
- Dynamic OG image generation, sitemap.xml, robots.txt, JSON-LD (Organization/WebSite/BreadcrumbList)
- Indian-market formatting (₹ lakh/crore grouping), mobile-first responsive layout

**Scaffolded, with a clear TODO for the next iteration:**
- Live activity feed currently derives from a `bids` query on each page load — swap in Supabase
  Realtime (`supabase.channel(...)`) for a true live-updating panel.
- Admin panel's bid-rule editor (min bid / increments / promo codes) — the `platform_config` and
  `promo_codes` tables exist and are read by the order route; add a form to `/admin` to write to
  them the same way the moderation queue already does.
- Rank-history charts on the company page and dashboard — the data (`rank_history`) is there;
  wire in Recharts (already an available dependency in the design skill's stack).
- Auth UI (the actual Google/email-magic-link buttons) — Supabase Auth is wired end-to-end
  (`middleware.ts`, `/auth/callback`, RLS policies), but the sign-in buttons themselves are
  currently a placeholder call to `supabase.auth.signInWithOAuth(...)` you should drop in.
- Rate limiting, duplicate-payment protection beyond the unique constraint on
  `razorpay_order_id`/`razorpay_payment_id`, and bot-click filtering beyond the basic user-agent
  check — Upstash Redis is listed as an optional dependency for this.

## 5. Local setup

```bash
cp .env.example .env.local
# fill in Supabase + Razorpay + Resend keys

npm install
```

1. Create a Supabase project.
2. Paste `supabase/schema.sql` into the Supabase SQL Editor and run it.
3. Run `npm run seed` — creates 10 fictional demo founder accounts, then prints instructions to
   paste `supabase/seed.sql` into the SQL Editor (Supabase's JS client can't run arbitrary
   multi-statement SQL directly, only the dashboard's SQL Editor or `psql` can).
4. `npm run dev` → http://localhost:3000

### Razorpay webhook locally

Razorpay needs a public URL to send webhooks to. Use the Razorpay CLI or a tunnel:

```bash
npx razorpay-cli tunnel --port 3000  # or ngrok http 3000
```

Register `https://<your-tunnel>/api/razorpay/webhook` in the Razorpay Dashboard, subscribed to
`payment.captured` and `payment.failed`, and copy the webhook secret into
`RAZORPAY_WEBHOOK_SECRET`.

## 6. Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add every variable from `.env.example` in Project Settings → Environment Variables.
4. Set the Razorpay webhook URL to `https://your-domain/api/razorpay/webhook` in production too.
5. Deploy. Public leaderboard pages render server-side (`revalidate = 30`) and are cached at the
   edge, refreshing every 30 seconds.

## 7. Seed data disclosure

Every company in `supabase/seed.sql` (NammaAI, ChaiStack, RocketDukaan, PaisaPilot, CodeYatra,
PixelWala, LaunchBharat, DukaanFlow, Foundrly, StackMint) is **fictional**, marked `is_seed = true`,
and exists only for local development and demos. Filter `is_seed = false` before computing any
public "real" stats once genuine listings exist.
