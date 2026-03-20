import type { SupabaseClient } from "@supabase/supabase-js";

type RpcRow = { project_id: string; file_id: string };

/** Pro Projekt höchstens eine Datei-ID (ältestes Upload) – 1× RPC statt aller project_files-Zeilen. */
export async function mapFirstFileIdByProjectId(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Record<string, string>> {
  const thumbByProjectId: Record<string, string> = {};
  if (projectIds.length === 0) return thumbByProjectId;

  const { data, error } = await supabase.rpc("first_file_id_per_project", {
    p_ids: projectIds,
  });

  if (!error && data) {
    for (const row of data as RpcRow[]) {
      if (row?.project_id && row?.file_id) thumbByProjectId[row.project_id] = row.file_id;
    }
    return thumbByProjectId;
  }

  // Ohne Migration / temporärer RPC-Fehler: früheres Verhalten (nur für betroffene IDs)
  const { data: rows } = await supabase
    .from("project_files")
    .select("id, project_id, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: true });

  for (const f of rows ?? []) {
    if (!thumbByProjectId[f.project_id]) thumbByProjectId[f.project_id] = f.id;
  }
  return thumbByProjectId;
}
