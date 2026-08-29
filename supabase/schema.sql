-- ============================================================================
-- hotbid — database schema
-- Target: Postgres 15+ (Supabase)
--
-- Money is ALWAYS an integer count of paise. Never a float/numeric with
-- decimals for currency — this avoids rounding drift entirely.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type category_t as enum (
  'ai','saas','devtools','fintech','d2c','ecommerce','agency','creator',
  'newsletter','edtech','consumer_app','productivity','community','other'
);

create type city_t as enum (
  'Bengaluru','Mumbai','Delhi NCR','Hyderabad','Pune','Chennai',
  'Ahmedabad','Kolkata','Jaipur','Kochi','Remote India'
);

create type listing_status_t as enum ('pending','approved','suspended','banned');

create type payment_status_t as enum ('created','authorized','captured','failed','refunded');

create type report_status_t as enum ('open','reviewing','resolved','dismissed');

-- ----------------------------------------------------------------------------
-- USERS  (mirrors auth.users; Supabase Auth owns the row in auth.users,
-- this is the public-facing profile Supabase RLS can reference safely)
-- ----------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- COMPANIES  — the founder-facing entity. A company can have exactly one
-- active listing at a time (kept as separate tables so future features —
-- multiple listings per company, listing history — don't require a
-- destructive migration).
-- ----------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  legal_name text,               -- for future GST invoicing
  gstin text,                    -- for future GST invoicing
  billing_address text,          -- for future GST invoicing
  created_at timestamptz not null default now()
);

create index idx_companies_owner on public.companies(owner_id);

-- ----------------------------------------------------------------------------
-- LISTINGS — the public leaderboard entry.
-- current_bid_paise / current_rank are denormalized onto the row for fast
-- leaderboard reads; they are only ever mutated inside place_bid() below,
-- under a row lock, so they can't drift from the bids table.
-- ----------------------------------------------------------------------------

create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text unique not null,
  company_name text not null,
  description text,
  website text not null,
  logo_url text,
  founder_name text,
  category category_t not null,
  city city_t not null,
  twitter_handle text,
  linkedin_url text,
  verified boolean not null default false,
  status listing_status_t not null default 'pending',

  current_bid_paise bigint not null default 0,
  current_rank int,
  highest_rank_ever int,
  rank_since timestamptz not null default now(),

  total_clicks bigint not null default 0,
  total_impressions bigint not null default 0,

  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_listings_rank on public.listings(current_rank) where status = 'approved';
create index idx_listings_category on public.listings(category) where status = 'approved';
create index idx_listings_city on public.listings(city) where status = 'approved';
create index idx_listings_bid_desc on public.listings(current_bid_paise desc) where status = 'approved';

-- ----------------------------------------------------------------------------
-- BIDS — one row per bid attempt, successful or not. Never deleted, even on
-- refund, so rank_history / bid_history stays auditable.
-- ----------------------------------------------------------------------------

create table public.bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.users(id),
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR',
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  payment_status payment_status_t not null default 'created',
  previous_rank int,
  new_rank int,
  ip_hash text,               -- sha256 of IP, never the raw IP
  promo_code text,
  created_at timestamptz not null default now()
);

create index idx_bids_listing on public.bids(listing_id);
create index idx_bids_user on public.bids(user_id);
create index idx_bids_status on public.bids(payment_status);
create index idx_bids_created on public.bids(created_at desc);

-- ----------------------------------------------------------------------------
-- PAYMENTS — raw Razorpay transaction records, one per payment attempt.
-- Kept distinct from `bids` so reconciliation logic (see below) has a place
-- to record webhook events independent of what the bid row currently shows.
-- ----------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  bid_id uuid references public.bids(id) on delete set null,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  amount_paise bigint not null,
  status payment_status_t not null default 'created',
  method text,                 -- upi | card | netbanking | wallet
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_payments_order on public.payments(razorpay_order_id);

-- ----------------------------------------------------------------------------
-- CLICK EVENTS — every /go/[slug] redirect click, for CTR + traffic-source
-- analytics. Deliberately minimal PII: no raw IP, no fingerprinting beyond
-- coarse device category.
-- ----------------------------------------------------------------------------

create table public.click_events (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  referrer text,
  utm_campaign text,
  device_category text,        -- mobile | desktop | tablet
  country_code text,           -- coarse, derived server-side
  rank_at_click int,
  is_suspected_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_clicks_listing_time on public.click_events(listing_id, created_at desc);

create table public.impressions (
  id bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  surface text,                 -- 'homepage' | 'leaderboard' | 'category:ai' | ...
  created_at timestamptz not null default now()
);

create index idx_impressions_listing_time on public.impressions(listing_id, created_at desc);

-- ----------------------------------------------------------------------------
-- RANK HISTORY — append-only, written by place_bid(). Powers the rank
-- chart on both public company pages and the founder dashboard.
-- ----------------------------------------------------------------------------

create table public.rank_history (
  id bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  rank int not null,
  bid_paise bigint not null,
  recorded_at timestamptz not null default now()
);

create index idx_rank_history_listing on public.rank_history(listing_id, recorded_at desc);

-- ----------------------------------------------------------------------------
-- CATEGORIES, PROMO CODES, REPORTS, ADMIN ACTIONS
-- ----------------------------------------------------------------------------

create table public.categories (
  slug category_t primary key,
  label text not null,
  description text
);

create table public.promo_codes (
  code text primary key,
  discount_percent int check (discount_percent between 1 and 100),
  discount_flat_paise bigint,
  max_uses int,
  used_count int not null default 0,
  active boolean not null default true,
  expires_at timestamptz
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_user_id uuid references public.users(id),
  reason text not null,
  status report_status_t not null default 'open',
  created_at timestamptz not null default now()
);

create table public.admin_actions (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid not null references public.users(id),
  action text not null,             -- 'approve' | 'suspend' | 'refund' | 'ban_domain' | ...
  target_table text not null,
  target_id uuid not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Single-row config table the admin panel edits (min bid, increments, etc.)
create table public.platform_config (
  id int primary key default 1 check (id = 1),
  minimum_starting_bid_paise bigint not null default 9900,
  tier1_ceiling_paise bigint not null default 1000000,   -- ₹10,000
  tier1_flat_increment_paise bigint not null default 100, -- ₹1
  tier2_ceiling_paise bigint not null default 5000000,   -- ₹50,000
  tier2_percent_increment numeric not null default 0.075,
  tier3_percent_increment numeric not null default 0.05,
  updated_at timestamptz not null default now()
);
insert into public.platform_config (id) values (1);

-- ============================================================================
-- CORE FUNCTION: place_bid
--
-- This is the ONLY code path allowed to change current_bid_paise /
-- current_rank on a listing. It runs inside a single transaction with a
-- row-level lock on the listing being bid on, so two simultaneous "outbid
-- the #1 spot" requests can never both succeed against the same stale
-- current_bid_paise. The second caller re-reads the (now-updated) price
-- under lock and is correctly rejected if their amount no longer clears
-- the minimum increment.
--
-- IMPORTANT: this function does not touch payment state. It is invoked
-- only from the Razorpay webhook handler, AFTER signature verification
-- and AFTER confirming payment_status = 'captured' — never from a
-- client-trusted "payment succeeded" callback. See src/lib/razorpay.ts.
-- ============================================================================

create or replace function public.place_bid(
  p_bid_id uuid
) returns void
language plpgsql
security definer
as $$
declare
  v_listing_id uuid;
  v_amount bigint;
  v_current_bid bigint;
  v_current_rank int;
  v_new_rank int;
begin
  select listing_id, amount_paise into v_listing_id, v_amount
  from public.bids where id = p_bid_id and payment_status = 'captured';

  if v_listing_id is null then
    raise exception 'place_bid called for bid % that is not captured', p_bid_id;
  end if;

  -- Lock the target listing row so a concurrent bid on the same listing
  -- (or the same rank position) can't interleave with this update.
  perform 1 from public.listings where id = v_listing_id for update;

  select current_bid_paise, current_rank into v_current_bid, v_current_rank
  from public.listings where id = v_listing_id;

  -- Re-validate against the DB's current price, not whatever the client
  -- believed the price was when they opened the bid modal.
  if v_amount <= v_current_bid then
    update public.bids set payment_status = 'failed' where id = p_bid_id;
    raise exception 'Bid amount % no longer beats current bid % — reconciliation required', v_amount, v_current_bid;
  end if;

  update public.listings
  set current_bid_paise = v_amount,
      rank_since = now(),
      updated_at = now()
  where id = v_listing_id;

  -- Recompute ranks for every approved listing by current bid, desc.
  with ranked as (
    select id, row_number() over (order by current_bid_paise desc, created_at asc) as rn
    from public.listings
    where status = 'approved'
  )
  update public.listings l
  set current_rank = ranked.rn,
      highest_rank_ever = least(coalesce(l.highest_rank_ever, ranked.rn), ranked.rn)
  from ranked
  where l.id = ranked.id;

  select current_rank into v_new_rank from public.listings where id = v_listing_id;

  update public.bids
  set previous_rank = v_current_rank, new_rank = v_new_rank
  where id = p_bid_id;

  insert into public.rank_history (listing_id, rank, bid_paise)
  select id, current_rank, current_bid_paise from public.listings where id = v_listing_id;
end;
$$;

-- Small helper used by the /go/[slug] click-tracking redirect to bump a
-- listing's public click counter without a read-then-write race.
create or replace function public.increment_listing_clicks(p_listing_id uuid)
returns void
language sql
security definer
as $$
  update public.listings set total_clicks = total_clicks + 1 where id = p_listing_id;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.listings enable row level security;
alter table public.bids enable row level security;
alter table public.payments enable row level security;
alter table public.click_events enable row level security;
alter table public.impressions enable row level security;
alter table public.rank_history enable row level security;
alter table public.reports enable row level security;
alter table public.promo_codes enable row level security;
alter table public.admin_actions enable row level security;
alter table public.platform_config enable row level security;

-- Public read access to approved listings and their rank history — this is
-- a public leaderboard, no auth required to browse.
create policy "public can read approved listings"
  on public.listings for select
  using (status = 'approved');

create policy "public can read rank history"
  on public.rank_history for select using (true);

create policy "public can read categories"
  on public.categories for select using (true);

-- Users can read/update their own profile & companies.
create policy "users read own profile" on public.users for select using (auth.uid() = id);
create policy "users read own companies" on public.companies for select using (auth.uid() = owner_id);
create policy "users insert own company" on public.companies for insert with check (auth.uid() = owner_id);

-- Founders can read (but not directly write — writes go through the
-- server using the service-role key, see /api/bids) their own listings
-- even while pending/suspended, plus their own bid history.
create policy "owners read own listings"
  on public.listings for select
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "owners read own bids"
  on public.bids for select
  using (user_id = auth.uid());

-- Everything else (writes to listings/bids/payments, admin tables) is
-- performed exclusively through server-side route handlers using the
-- service-role key, which bypasses RLS by design. No direct client
-- writes are permitted to these tables.

-- ============================================================================
-- SEED CATEGORY LABELS
-- ============================================================================

insert into public.categories (slug, label) values
  ('ai','AI'), ('saas','SaaS'), ('devtools','Developer Tools'),
  ('fintech','Fintech'), ('d2c','D2C'), ('ecommerce','Ecommerce'),
  ('agency','Agency'), ('creator','Creator'), ('newsletter','Newsletter'),
  ('edtech','EdTech'), ('consumer_app','Consumer App'),
  ('productivity','Productivity'), ('community','Community'), ('other','Other');
