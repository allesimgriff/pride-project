"use server";

import { createClient } from "@/lib/supabase/server";
import { sendRoleChangedEmail } from "@/lib/mail";

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
    .select("id, role, email, full_name")
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

  try {
    await sendRoleChangedEmail({
      to: target.email,
      fullName: target.full_name ?? null,
      role: "admin",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Mail-Fehler.";
    return { error: `Rolle geändert, aber E-Mail konnte nicht gesendet werden: ${msg}` };
  }

  return { error: null };
}

export async function demoteAdminAction(
  targetProfileId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return { error: "Nur Admin darf Rollen ändern." };

  const targetId = targetProfileId.trim();
  if (!targetId) return { error: "Ungültige Ziel-Person." };

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, email, full_name")
    .eq("id", targetId)
    .single();

  if (targetError || !target) {
    return { error: targetError?.message ?? "Zielperson nicht gefunden." };
  }

  if (target.role !== "admin") return { error: "Diese Person ist kein Admin." };

  const { count: adminCount, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countError) return { error: countError.message };
  if ((adminCount ?? 0) <= 1) {
    return { error: "Der letzte Admin kann nicht zum Mitarbeiter gemacht werden." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "entwicklung" })
    .eq("id", targetId);

  if (updateError) return { error: updateError.message };

  try {
    await sendRoleChangedEmail({
      to: target.email,
      fullName: target.full_name ?? null,
      role: "entwicklung",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Mail-Fehler.";
    return { error: `Rolle geändert, aber E-Mail konnte nicht gesendet werden: ${msg}` };
  }

  return { error: null };
}

