import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

/**
 * Bans the listing outright and records its domain so future submissions
 * from the same domain can be flagged. (A `banned_domains` lookup table
 * is a natural follow-up if this needs to actively block resubmission at
 * checkout time — this route records the ban; enforcing it against new
 * submissions is a small addition to the order route's validation.)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Not authorized." }, { status: guard.status });

  const { data: listing, error: fetchError } = await guard.admin
    .from("listings")
    .select("website")
    .eq("id", params.id)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const { error } = await guard.admin
    .from("listings")
    .update({ status: "banned" })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let domain: string | null = null;
  try { domain = new URL(listing.website).hostname; } catch { /* malformed URL, skip domain capture */ }

  await logAdminAction(guard.admin, guard.userId, "ban", "listings", params.id, domain ?? undefined);

  return NextResponse.redirect(new URL("/admin", req.url));
}
