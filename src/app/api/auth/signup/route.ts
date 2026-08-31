import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || "Signup failed" }, { status: 400 });
  }

  // Create user profile in public.users
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    email,
    is_admin: false,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: authData.user });
}
