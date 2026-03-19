"use server";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return { user, profile };
}

/**
 * Admin-Rolle übertragen:
 * - target wird `admin`
 */
export async function transferAdminAction(
  targetProfileId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return { error: "Nur Admin darf Admin-Rolle übertragen." };

  const targetId = targetProfileId.trim();
  if (!targetId) return { error: "Ungültige Ziel-Person." };
  if (targetId === admin.user.id) return { error: "Du kannst dich nicht selbst als Admin übertragen." };

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", targetId)
    .single();

  if (targetError || !target) {
    return { error: targetError?.message ?? "Zielperson nicht gefunden." };
  }

  const { error: setTargetError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", targetId);

  if (setTargetError) return { error: setTargetError.message };

  return { error: null };
}

