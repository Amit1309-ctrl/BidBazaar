import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase";

// Temporary no-payment claim endpoint. Listings remain pending until reviewed.
const bodySchema = z.object({
  companyName: z.string().min(1),
  website: z.string().min(1),
  founderName: z.string().min(1),
  email: z.string().email(),
  category: z.string(),
  city: z.string(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const form = parsed.data;
  const admin = createAdminSupabase();
  const { data: existingUser } = await admin.from("users").select("id").eq("email", form.email).maybeSingle();
  let userId = existingUser?.id;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: form.email,
      email_confirm: false,
      user_metadata: { display_name: form.founderName },
    });
    if (error || !created.user) return NextResponse.json({ error: "Could not create account." }, { status: 500 });
    userId = created.user.id;
    const { error: userError } = await admin.from("users").insert({ id: userId, email: form.email, display_name: form.founderName });
    if (userError) return NextResponse.json({ error: "Could not save customer details." }, { status: 500 });
  }

  const { data: company, error: companyError } = await admin.from("companies").insert({ owner_id: userId }).select("id").single();
  if (companyError || !company) return NextResponse.json({ error: "Could not create company." }, { status: 500 });

  const { data: listing, error: listingError } = await admin.from("listings").insert({
    company_id: company.id,
    slug: slugify(form.companyName),
    company_name: form.companyName,
    website: normalizeUrl(form.website),
    founder_name: form.founderName,
    category: form.category,
    city: form.city,
    status: "pending",
  }).select("id").single();

  if (listingError || !listing) return NextResponse.json({ error: "Could not create listing." }, { status: 500 });
  return NextResponse.json({ listingId: listing.id }, { status: 201 });
}

function slugify(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
