import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/**
 * Supabase Auth (magic link email + Google OAuth) redirects here with a
 * `code` param after the person confirms. Exchanging it sets the session
 * cookie via createServerSupabase's cookie adapter, then we send them on
 * to wherever they were headed — the dashboard by default.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
