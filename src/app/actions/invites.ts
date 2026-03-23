"use server";

import { createClient } from "@/lib/supabase/server";
import type { Invite, Profile } from "@/types/database";
import { sendInviteEmail, resolveMailAppBaseUrl } from "@/lib/mail";

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
    ...(profiles ?? []).map(
      (p): StaffEntry => ({ type: "profile", profile: p }),
    ),
    ...(invites ?? []).map(
      (i): StaffEntry => ({ type: "invite", invite: i }),
    ),
  ];

  return { data: staff, error: null };
}

export async function createInviteAction(
  email: string,
  fullName: string | null
): Promise<{
  token?: string;
  error: string | null;
  mailMessageId?: string;
  mailProvider?: "resend" | "smtp";
}> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) {
    return { error: "Nur Admin darf Mitarbeiter einladen.", token: undefined };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "E-Mail ist erforderlich.", token: undefined };
  }
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  if (!isValidEmail) {
    return { error: "Ungültige E-Mail-Adresse (bitte mit @).", token: undefined };
  }

  const cleanFullName = fullName && fullName.trim() ? fullName.trim() : null;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile) {
    return {
      error: "Diese E-Mail ist bereits registriert. Bitte anmelden, keine neue Einladung.",
      token: undefined,
    };
  }

  await supabase
    .from("invites")
    .delete()
    .eq("email", normalizedEmail)
    .is("accepted_at", null);

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

  if (error || !data?.token) {
    return { error: error?.message ?? "Einladung konnte nicht angelegt werden.", token: undefined };
  }

  // Einladungs-E-Mail verschicken (bei Fehler -> UI bekommt Fehlermeldung)
  try {
    const mail = await sendInviteEmail({
      to: normalizedEmail,
      token: data.token as string,
      fullName: cleanFullName,
      appBaseUrl: await resolveMailAppBaseUrl(),
    });
    return {
      token: data.token,
      error: null,
      mailMessageId: mail.messageId,
      mailProvider: mail.provider,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler beim Mailversand.";
    return { token: data.token, error: `Einladung angelegt, aber E-Mail konnte nicht gesendet werden: ${msg}` };
  }
}

export async function revokeInviteAction(inviteId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) {
    return { error: "Nur Admin darf Einladungen widerrufen." };
  }

  const cleanId = inviteId.trim();
  if (!cleanId) {
    return { error: "Ungültige Einladung." };
  }

  const { error } = await supabase.from("invites").delete().eq("id", cleanId);
  if (error) return { error: error.message };

  return { error: null };
}
