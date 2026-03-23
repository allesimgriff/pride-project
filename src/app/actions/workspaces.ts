"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WORKSPACE_FIRST_CATEGORY } from "@/lib/projectCategoryDefaults";
import { randomUUID } from "crypto";
import { isAppAdmin, isWorkspaceAdmin } from "@/lib/workspacePermissions";
import { resolveMailAppBaseUrl, sendWorkspaceInviteEmail } from "@/lib/mail";
import type { WorkspaceMemberRole } from "@/types/database";

export async function listMyWorkspacesAction(): Promise<{
  data: { id: string; name: string; role: WorkspaceMemberRole }[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Nicht angemeldet." };

  const { data: mids, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id);

  if (error) return { data: [], error: error.message };
  const ids = [...new Set((mids || []).map((m) => m.workspace_id))];
  if (ids.length === 0) return { data: [], error: null };

  const { data: wrows, error: wErr } = await supabase.from("workspaces").select("id, name").in("id", ids);
  if (wErr) return { data: [], error: wErr.message };

  const roleById = new Map((mids || []).map((m) => [m.workspace_id, m.role as WorkspaceMemberRole]));
  const out = (wrows || []).map((w) => ({
    id: w.id,
    name: w.name,
    role: roleById.get(w.id) ?? "member",
  }));
  out.sort((a, b) => a.name.localeCompare(b.name, "de"));
  return { data: out, error: null };
}

export async function createWorkspaceAction(name: string): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Nicht angemeldet." };
  const trimmed = name.trim();
  if (!trimmed) return { id: null, error: "Name erforderlich." };

  const { data: ws, error: wErr } = await supabase
    .from("workspaces")
    .insert({ name: trimmed, created_by: user.id })
    .select("id")
    .single();

  if (wErr || !ws) return { id: null, error: wErr?.message ?? "Workspace konnte nicht angelegt werden." };

  const { error: mErr } = await supabase.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: "admin",
  });

  if (mErr) return { id: null, error: mErr.message };

  const { error: catErr } = await supabase.from("project_categories").insert({
    workspace_id: ws.id,
    name: DEFAULT_WORKSPACE_FIRST_CATEGORY.name,
    prefix: DEFAULT_WORKSPACE_FIRST_CATEGORY.prefix,
    sort_order: DEFAULT_WORKSPACE_FIRST_CATEGORY.sortOrder,
  });
  if (catErr) return { id: null, error: catErr.message };

  return { id: ws.id, error: null };
}

export async function updateWorkspaceNameAction(
  workspaceId: string,
  name: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name erforderlich." };

  if (!(await isWorkspaceAdmin(supabase, user.id, workspaceId)) && !(await isAppAdmin(supabase, user.id))) {
    return { error: "Nur Workspace-Admins dürfen den Namen ändern." };
  }

  const { error } = await supabase.from("workspaces").update({ name: trimmed }).eq("id", workspaceId);
  return { error: error?.message ?? null };
}

export async function deleteWorkspaceAction(workspaceId: string): Promise<{
  ok: boolean;
  error?: string;
  blockingProjectCount?: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  if (!(await isWorkspaceAdmin(supabase, user.id, workspaceId)) && !(await isAppAdmin(supabase, user.id))) {
    return { ok: false, error: "Nur Workspace-Admins dürfen den Workspace löschen." };
  }

  const { count, error: countErr } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (countErr) return { ok: false, error: countErr.message };
  const n = count ?? 0;
  if (n > 0) return { ok: false, blockingProjectCount: n };

  const { error: delErr } = await supabase.from("workspaces").delete().eq("id", workspaceId);
  if (delErr) return { ok: false, error: delErr.message };
  return { ok: true };
}

export async function getWorkspaceDetailAction(workspaceId: string): Promise<{
  workspace: { id: string; name: string } | null;
  members: { user_id: string; email: string; full_name: string | null; role: WorkspaceMemberRole }[];
  invites: { id: string; email: string; created_at: string; token: string }[];
  canManage: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { workspace: null, members: [], invites: [], canManage: false, error: "Nicht angemeldet." };

  const appAdm = await isAppAdmin(supabase, user.id);
  const { data: mem } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!mem && !appAdm) {
    return { workspace: null, members: [], invites: [], canManage: false, error: "Keine Berechtigung." };
  }

  const canManage =
    appAdm || (await isWorkspaceAdmin(supabase, user.id, workspaceId));

  const { data: w, error: wErr } = await supabase.from("workspaces").select("id, name").eq("id", workspaceId).single();
  if (wErr || !w)
    return { workspace: null, members: [], invites: [], canManage: false, error: wErr?.message ?? "Workspace nicht gefunden." };

  const { data: mrows } = await supabase
    .from("workspace_members")
    .select("user_id, role, profiles (email, full_name)")
    .eq("workspace_id", workspaceId);

  const members =
    mrows?.map((m) => {
      const p = m.profiles as unknown as { email: string; full_name: string | null } | null;
      return {
        user_id: m.user_id,
        email: p?.email ?? "",
        full_name: p?.full_name ?? null,
        role: m.role as WorkspaceMemberRole,
      };
    }) ?? [];

  let invites: { id: string; email: string; created_at: string; token: string }[] = [];
  if (canManage) {
    const { data: irows } = await supabase
      .from("workspace_invites")
      .select("id, email, created_at, token")
      .eq("workspace_id", workspaceId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    invites = (irows || []) as { id: string; email: string; created_at: string; token: string }[];
  }

  return {
    workspace: w,
    members,
    invites,
    canManage,
    error: null,
  };
}

export async function inviteToWorkspaceAction(
  workspaceId: string,
  email: string,
  inviteRole: WorkspaceMemberRole = "member"
): Promise<{
  token: string | null;
  error: string | null;
  /** true, wenn sendWorkspaceInviteEmail gelaufen ist */
  mailSent: boolean;
  /** Kurzgrund, wenn mailSent false aber token gesetzt (Einladung in DB) */
  mailError: string | null;
  mailMessageId?: string;
  mailProvider?: "resend" | "smtp";
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { token: null, error: "Nicht angemeldet.", mailSent: false, mailError: null };

  if (!(await isWorkspaceAdmin(supabase, user.id, workspaceId)) && !(await isAppAdmin(supabase, user.id))) {
    return { token: null, error: "Nur Workspace-Admins dürfen einladen.", mailSent: false, mailError: null };
  }

  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { token: null, error: "Ungültige E-Mail.", mailSent: false, mailError: null };
  }

  const token = randomUUID();

  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    email: normalized,
    token,
    role: inviteRole,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        token: null,
        error: "Für diese E-Mail gibt es bereits eine offene Einladung.",
        mailSent: false,
        mailError: null,
      };
    }
    return { token: null, error: error.message, mailSent: false, mailError: null };
  }

  const { data: wsRow } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();
  const workspaceName = wsRow?.name?.trim() ?? "";

  try {
    const mail = await sendWorkspaceInviteEmail({
      to: normalized,
      token,
      workspaceName,
      appBaseUrl: await resolveMailAppBaseUrl(),
    });
    return {
      token,
      error: null,
      mailSent: true,
      mailError: null,
      mailMessageId: mail.messageId,
      mailProvider: mail.provider,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler beim Mailversand.";
    return {
      token,
      error: null,
      mailSent: false,
      mailError: msg,
    };
  }
}

export async function revokeWorkspaceInviteAction(inviteId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: inv } = await supabase.from("workspace_invites").select("workspace_id").eq("id", inviteId).single();
  if (!inv) return { error: "Einladung nicht gefunden." };

  if (!(await isWorkspaceAdmin(supabase, user.id, inv.workspace_id)) && !(await isAppAdmin(supabase, user.id))) {
    return { error: "Keine Berechtigung." };
  }

  const { error } = await supabase.from("workspace_invites").delete().eq("id", inviteId);
  return { error: error?.message ?? null };
}

export async function setWorkspaceMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  role: WorkspaceMemberRole,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  if (!(await isWorkspaceAdmin(supabase, user.id, workspaceId)) && !(await isAppAdmin(supabase, user.id))) {
    return { error: "Keine Berechtigung." };
  }

  if (role !== "admin" && role !== "member") {
    return { error: "Ungültige Rolle." };
  }

  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) return { error: "Mitglied nicht gefunden." };

  if (target.role === "admin" && role === "member") {
    const { data: admins } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .eq("role", "admin");
    if ((admins?.length ?? 0) <= 1) {
      return { error: "Der letzte Workspace-Admin kann nicht zurückgestuft werden." };
    }
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  return { error: error?.message ?? null };
}

export async function removeWorkspaceMemberAction(
  workspaceId: string,
  targetUserId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  if (targetUserId === user.id) {
    return { error: "Zum Austreten „Mitglied entfernen“ für das eigene Konto nicht nutzen." };
  }

  if (!(await isWorkspaceAdmin(supabase, user.id, workspaceId)) && !(await isAppAdmin(supabase, user.id))) {
    return { error: "Nur Workspace-Admins dürfen Mitglieder entfernen." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  return { error: error?.message ?? null };
}

export async function leaveWorkspaceAction(workspaceId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: admins } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("role", "admin");

  const adminIds = admins?.map((a) => a.user_id) ?? [];
  if (adminIds.includes(user.id) && adminIds.length < 2) {
    return { error: "Letzter Admin: bitte zuerst einen anderen Admin ernennen oder Workspace löschen." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id);

  return { error: error?.message ?? null };
}

export async function acceptWorkspaceInviteAction(token: string): Promise<{
  ok: boolean;
  workspaceId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const clean = token.trim();
  if (!clean) return { ok: false, workspaceId: null, error: "Token fehlt." };

  const { data, error } = await supabase.rpc("accept_workspace_invite", { p_token: clean });

  if (error) return { ok: false, workspaceId: null, error: error.message };

  const parsed = data as { ok?: boolean; workspace_id?: string; error?: string } | null;
  if (!parsed?.ok) {
    const code = parsed?.error ?? "unknown";
    const msg =
      code === "invalid_or_used"
        ? "Einladung ungültig oder bereits verwendet."
        : code === "not_authenticated"
          ? "Bitte zuerst anmelden, dann den Link erneut öffnen."
          : code === "email_mismatch"
            ? "Diese Einladung gehört zu einer anderen E-Mail-Adresse."
            : "Einladung konnte nicht angenommen werden.";
    return { ok: false, workspaceId: null, error: msg };
  }

  return { ok: true, workspaceId: parsed.workspace_id ?? null, error: null };
}

/** Workspaces, in die der Nutzer Projekte verschieben darf (App-Admin: alle; sonst nur Workspace-Admin). */
export async function listWorkspacesForProjectMoveAction(): Promise<{
  data: { id: string; name: string }[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Nicht angemeldet." };

  if (await isAppAdmin(supabase, user.id)) {
    const { data, error } = await supabase.from("workspaces").select("id, name").order("name");
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  const { data: mids, error: mErr } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (mErr) return { data: [], error: mErr.message };
  const ids = [...new Set((mids || []).map((m) => m.workspace_id))];
  if (ids.length === 0) return { data: [], error: null };

  const { data: wrows, error: wErr } = await supabase
    .from("workspaces")
    .select("id, name")
    .in("id", ids)
    .order("name");

  if (wErr) return { data: [], error: wErr.message };
  return { data: wrows ?? [], error: null };
}
