import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Not authorized." }, { status: guard.status });

  const { error } = await guard.admin
    .from("listings")
    .update({ status: "approved" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(guard.admin, guard.userId, "approve", "listings", params.id);

  return NextResponse.redirect(new URL("/admin", req.url));
}
