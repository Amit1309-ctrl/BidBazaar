/**
 * Development seed script.
 *
 * SQL alone can't safely create auth.users rows (Supabase manages that
 * table's internals), so this script:
 *   1. Creates a demo auth user + public.users + public.companies row
 *      per fictional seed listing, via the Supabase Admin API.
 *   2. Executes supabase/seed.sql, which inserts the actual listings
 *      against those company ids.
 *
 * Usage:
 *   cp .env.example .env.local   # fill in your Supabase project values
 *   npm run seed
 *
 * Safe to re-run — every insert uses fixed UUIDs with ON CONFLICT DO NOTHING.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_FOUNDERS = [
  { companyId: "a1111111-0000-0000-0000-000000000001", email: "founder1@nammaai.example.com", name: "Ritika Shah" },
  { companyId: "a1111111-0000-0000-0000-000000000002", email: "founder2@chaistack.example.com", name: "Aman Verma" },
  { companyId: "a1111111-0000-0000-0000-000000000003", email: "founder3@rocketdukaan.example.com", name: "Priya Nair" },
  { companyId: "a1111111-0000-0000-0000-000000000004", email: "founder4@paisapilot.example.com", name: "Karan Mehta" },
  { companyId: "a1111111-0000-0000-0000-000000000005", email: "founder5@codeyatra.example.com", name: "Sneha Iyer" },
  { companyId: "a1111111-0000-0000-0000-000000000006", email: "founder6@pixelwala.example.com", name: "Devansh Rao" },
  { companyId: "a1111111-0000-0000-0000-000000000007", email: "founder7@launchbharat.example.com", name: "Meera Pillai" },
  { companyId: "a1111111-0000-0000-0000-000000000008", email: "founder8@dukaanflow.example.com", name: "Farhan Sheikh" },
  { companyId: "a1111111-0000-0000-0000-000000000009", email: "founder9@foundrly.example.com", name: "Ishaan Kapoor" },
  { companyId: "a1111111-0000-0000-0000-000000000010", email: "founder10@stackmint.example.com", name: "Ananya Joshi" },
];

async function main() {
  for (const f of SEED_FOUNDERS) {
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: f.email,
      email_confirm: true,
      user_metadata: { display_name: f.name, is_seed: true },
    });

    // If the user already exists (re-run), look them up instead of failing.
    let userId = created?.user?.id;
    if (authErr) {
      const { data: existing } = await admin.auth.admin.listUsers();
      userId = existing.users.find((u) => u.email === f.email)?.id;
    }
    if (!userId) {
      console.error(`Could not create or find auth user for ${f.email}`, authErr);
      continue;
    }

    await admin.from("users").upsert({ id: userId, email: f.email, display_name: f.name });
    await admin.from("companies").upsert({ id: f.companyId, owner_id: userId });
    console.log(`✓ seeded founder ${f.name} (${f.email})`);
  }

  const seedSql = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf-8");
  const { error } = await admin.rpc("exec_sql", { sql: seedSql }).single();
  if (error) {
    console.warn(
      "Could not run seed.sql via rpc('exec_sql', ...) — that helper function isn't part of a stock " +
      "Supabase project. Instead, paste supabase/seed.sql into the Supabase SQL Editor and run it once, " +
      "after this script has created the founder accounts above."
    );
  } else {
    console.log("✓ seed.sql applied");
  }

  console.log("\nDone. 10 fictional demo companies are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
