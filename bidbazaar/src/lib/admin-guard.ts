import { createServerSupabase, createAdminSupabase } from "@/lib/supabase";

/**
 * Every admin action route calls this first. Confirms the caller has a
 * valid session AND is flagged is_admin in public.users, before any
 * service-role write happens. This is the server-side authorization
 * check — RLS alone does not protect these actions, since they run
 * through the service-role client, so this guard is what stands in for it.
 */
export async function requireAdmin() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const };

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { ok: false as const, status: 403 as const };

  return { ok: true as const, userId: user.id, admin: createAdminSupabase() };
}

export async function logAdminAction(
  admin: ReturnType<typeof createAdminSupabase>,
  adminUserId: string,
  action: string,
  targetTable: string,
  targetId: string,
  notes?: string
) {
  await admin.from("admin_actions").insert({
    admin_user_id: adminUserId,
    action,
    target_table: targetTable,
    target_id: targetId,
    notes: notes ?? null,
  });
}
