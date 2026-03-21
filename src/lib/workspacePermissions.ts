import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function isAppAdmin(supabase: Supabase, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function isWorkspaceAdmin(
  supabase: Supabase,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

/** Stammdaten / Löschen: globaler App-Admin oder Workspace-Admin */
export async function canManageProjectAsAdmin(
  supabase: Supabase,
  userId: string,
  workspaceId: string | null
): Promise<boolean> {
  if (await isAppAdmin(supabase, userId)) return true;
  if (!workspaceId) return false;
  return isWorkspaceAdmin(supabase, userId, workspaceId);
}

/** Überschriften-Overrides pro Workspace: App-Admin oder Workspace-Admin */
export async function canEditWorkspaceLabels(
  supabase: Supabase,
  userId: string,
  workspaceId: string | null
): Promise<boolean> {
  if (!workspaceId) return false;
  if (await isAppAdmin(supabase, userId)) return true;
  return isWorkspaceAdmin(supabase, userId, workspaceId);
}
