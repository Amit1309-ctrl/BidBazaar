-- ============================================================================
-- hotbid — development seed data
-- All companies below are FICTIONAL, created for local development and
-- demos only. is_seed = true marks every row so it can be filtered out of
-- production stats or wiped with one query before go-live.
--
-- Run after schema.sql. Requires at least one row in auth.users per owner —
-- see scripts/seed.ts for the full flow including creating those users via
-- the Supabase Admin API (SQL alone can't create auth.users rows safely).
-- ============================================================================

-- This file assumes scripts/seed.ts has already inserted matching rows into
-- auth.users / public.users / public.companies with these fixed UUIDs.

insert into public.listings
  (id, company_id, slug, company_name, description, website, logo_url,
   founder_name, category, city, twitter_handle, verified, status,
   current_bid_paise, current_rank, highest_rank_ever, total_clicks, total_impressions, is_seed)
values
  ('11111111-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000001',
   'nammaai','NammaAI',
   'NammaAI helps small and mid-size Indian businesses qualify and follow up on leads over WhatsApp, automatically, in English and five regional languages.',
   'https://nammaai.example.com', null, 'Ritika Shah', 'ai', 'Bengaluru', 'nammaai', true, 'approved',
   42_500_00, 1, 1, 1284, 9800, true),

  ('11111111-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000002',
   'chaistack','ChaiStack','The dev stack for shipping fast, chai included',
   'ChaiStack bundles auth, payments, and hosting into one CLI so indie developers can ship a production app before their chai gets cold.',
   'https://chaistack.example.com', null, 'Aman Verma', 'saas', 'Remote India', 'chaistack', true, 'approved',
   38_000_00, 2, 2, 940, 7600, true),

  ('11111111-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000003',
   'rocketdukaan','RocketDukaan','Launch your D2C store in an afternoon',
   'RocketDukaan gives small D2C brands a storefront, UPI checkout, and Shiprocket-style logistics integration out of the box.',
   'https://rocketdukaan.example.com', null, 'Priya Nair', 'ecommerce', 'Mumbai', 'rocketdukaan', false, 'approved',
   31_200_00, 3, 3, 812, 6100, true),

  ('11111111-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000004',
   'paisapilot','PaisaPilot','Autopilot budgeting for freelancers',
   'PaisaPilot tracks GST-eligible expenses and irregular freelance income automatically, so tax season stops being a surprise.',
   'https://paisapilot.example.com', null, 'Karan Mehta', 'fintech', 'Delhi NCR', 'paisapilot', true, 'approved',
   24_800_00, 4, 4, 655, 5400, true),

  ('11111111-0000-0000-0000-000000000005','a1111111-0000-0000-0000-000000000005',
   'codeyatra','CodeYatra','Learn to code, the campus-tour way',
   'CodeYatra runs cohort-based programming bootcamps across tier-2 Indian cities, blending in-person meetups with an online curriculum.',
   'https://codeyatra.example.com', null, 'Sneha Iyer', 'edtech', 'Pune', 'codeyatra', false, 'approved',
   19_500_00, 5, 5, 501, 4200, true),

  ('11111111-0000-0000-0000-000000000006','a1111111-0000-0000-0000-000000000006',
   'pixelwala','PixelWala','On-demand design for Indian startups',
   'PixelWala is a flat-fee, unlimited-requests design subscription built around the pace and budget of early-stage Indian founders.',
   'https://pixelwala.example.com', null, 'Devansh Rao', 'agency', 'Hyderabad', 'pixelwala', false, 'approved',
   15_900_00, 6, 6, 388, 3300, true),

  ('11111111-0000-0000-0000-000000000007','a1111111-0000-0000-0000-000000000007',
   'launchbharat','LaunchBharat','Product Hunt meets India, minus the FOMO',
   'LaunchBharat is a weekly newsletter spotlighting new Indian products, with an editorial team that actually uses what they cover.',
   'https://launchbharat.example.com', null, 'Meera Pillai', 'creator', 'Chennai', 'launchbharat', false, 'approved',
   12_400_00, 7, 7, 301, 2700, true),

  ('11111111-0000-0000-0000-000000000008','a1111111-0000-0000-0000-000000000008',
   'dukaanflow','DukaanFlow','Inventory sync for WhatsApp-first sellers',
   'DukaanFlow keeps stock counts in sync across Instagram, WhatsApp catalog, and a seller''s physical shop register.',
   'https://dukaanflow.example.com', null, 'Farhan Sheikh', 'ecommerce', 'Ahmedabad', 'dukaanflow', false, 'approved',
   9_800_00, 8, 8, 260, 2100, true),

  ('11111111-0000-0000-0000-000000000009','a1111111-0000-0000-0000-000000000009',
   'foundrly','Foundrly','Where India''s early founders find their first ten users',
   'Foundrly is a community and directory pairing brand-new Indian startups with early adopters willing to try unfinished products.',
   'https://foundrly.example.com', null, 'Ishaan Kapoor', 'creator', 'Kolkata', 'foundrly', false, 'approved',
   6_200_00, 9, 9, 190, 1500, true),

  ('11111111-0000-0000-0000-000000000010','a1111111-0000-0000-0000-000000000010',
   'stackmint','StackMint','Turn your side project into a subscription business',
   'StackMint adds billing, metering, and dunning to any side project in under an hour, tuned for UPI autopay and Indian card mandates.',
   'https://stackmint.example.com', null, 'Ananya Joshi', 'saas', 'Kochi', 'stackmint', false, 'approved',
   4_990_00, 10, 10, 132, 1100, true)
on conflict (id) do nothing;

-- A handful of historical rank_history points so the dashboard chart and
-- public rank chart have something to draw on day one.
insert into public.rank_history (listing_id, rank, bid_paise, recorded_at)
select
  l.id,
  l.current_rank + (random() * 2)::int,
  greatest(l.current_bid_paise - (random() * 500000)::int, 49900),
  now() - (interval '1 day' * gs)
from public.listings l
cross join generate_series(1, 6) gs
where l.is_seed;

update public.platform_config set updated_at = now() where id = 1;
