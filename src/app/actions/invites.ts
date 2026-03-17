"use server";

import { createClient } from "@/lib/supabase/server";
import type { Invite, Profile } from "@/types/database";
import { sendInviteEmail } from "@/lib/mail";

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

export type StaffEntry =
  | {
      type: "profile";
      profile: Profile;
    }
  | {
      type: "invite";
      invite: Invite;
    };

export async function listStaffAction(): Promise<{ data: StaffEntry[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Nicht angemeldet." };
  }

  // Alle Profile
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (profilesError) {
    return { data: [], error: profilesError.message };
  }

  // Alle offenen Einladungen
  const { data: invites, error: invitesError } = await supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: true });
  if (invitesError) {
    return { data: [], error: invitesError.message };
  }

  const staff: StaffEntry[] = [
    ...(profiles ?? []).map((p) => ({ type: "profile", profile: p })),
    ...(invites ?? []).map((i) => ({ type: "invite", invite: i })),
  ];

  return { data: staff, error: null };
}

export async function createInviteAction(
  email: string,
  fullName: string | null
): Promise<{ token?: string; error: string | null }> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) {
    return { error: "Nur Admin darf Mitarbeiter einladen.", token: undefined };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "E-Mail ist erforderlich.", token: undefined };
  }

  const cleanFullName = fullName && fullName.trim() ? fullName.trim() : null;

  // Einfacher Token als UUID aus der Datenbank generieren lassen
  const { data, error } = await supabase
    .from("invites")
    .insert({
      email: normalizedEmail,
      full_name: cleanFullName,
      role: "projektleitung",
      token: crypto.randomUUID(),
      created_by: admin.user.id,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Einladung konnte nicht angelegt werden.", token: undefined };
  }

  // Einladungs-E-Mail verschicken (Fehler nur loggen, nicht an UI zurückgeben)
  try {
    await sendInviteEmail({
      to: normalizedEmail,
      token: data.token,
      fullName: cleanFullName,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[invites] Fehler beim Senden der Einladungs-Mail:", e);
  }

  return { token: data.token, error: null };
}
