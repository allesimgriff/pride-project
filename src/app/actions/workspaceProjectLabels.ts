"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type ProjectLabelKey,
  type ProjectLabelRow,
  buildMergedProjectLabelMap,
  projectLabelMapToRows,
} from "@/lib/projectLabelDefaults";
import { canEditWorkspaceLabels } from "@/lib/workspacePermissions";

/** App-Admin oder Workspace-Admin. */
async function getEditorForWorkspaceLabels(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (await canEditWorkspaceLabels(supabase, user.id, workspaceId)) return user;
  return null;
}

export async function canEditWorkspaceLabelsForWorkspaceAction(
  workspaceId: string,
): Promise<{ canEdit: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { canEdit: false };
  const ok = await canEditWorkspaceLabels(supabase, user.id, workspaceId);
  return { canEdit: ok };
}

/** Effektive Überschriften (global + Workspace-Overrides) als Tabellenzeilen. */
export async function listMergedProjectLabelsForWorkspaceAction(
  workspaceId: string,
): Promise<{ data: ProjectLabelRow[]; error: string | null }> {
  const supabase = await createClient();
  const [{ data: global }, wsRes] = await Promise.all([
    supabase.from("project_labels").select("key,label_de,label_en").order("sort_order", { ascending: true }),
    supabase.from("workspace_project_labels").select("key,label_de,label_en").eq("workspace_id", workspaceId),
  ]);

  const ws = wsRes.error ? [] : wsRes.data || [];
  const map = buildMergedProjectLabelMap(global || [], ws);
  return { data: projectLabelMapToRows(map), error: null };
}

export async function saveWorkspaceProjectLabelAction(input: {
  workspaceId: string;
  key: ProjectLabelKey;
  label_de: string;
  label_en: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const editor = await getEditorForWorkspaceLabels(supabase, input.workspaceId);
  if (!editor) {
    return { error: "Nur App-Administratoren dürfen Überschriften bearbeiten." };
  }

  const label_de = input.label_de.trim();
  const label_en = input.label_en.trim();
  if (!label_de || !label_en) {
    return { error: "DE und EN dürfen nicht leer sein." };
  }

  const { error } = await supabase.from("workspace_project_labels").upsert(
    {
      workspace_id: input.workspaceId,
      key: input.key,
      label_de,
      label_en,
      updated_by: editor.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,key" },
  );
  if (error) return { error: error.message };
  return { error: null };
}

/** Entfernt den Workspace-Override; es gelten wieder die globalen Standard-Überschriften. */
export async function deleteWorkspaceProjectLabelOverrideAction(input: {
  workspaceId: string;
  key: ProjectLabelKey;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const editor = await getEditorForWorkspaceLabels(supabase, input.workspaceId);
  if (!editor) {
    return { error: "Keine Berechtigung für Überschriften in diesem Workspace." };
  }

  const { error } = await supabase
    .from("workspace_project_labels")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("key", input.key);
  if (error) return { error: error.message };
  return { error: null };
}
