import type { SupabaseClient } from "@supabase/supabase-js";

/** Anteil belegt, ab dem die Warnung erscheint (75 %). */
export const WORKSPACE_STORAGE_WARN_THRESHOLD = 0.75;

/** Standard-Limit pro Workspace (5 GB), falls kein Env gesetzt. Später: pro Plan aus DB. */
export function getWorkspaceStorageLimitBytes(): number {
  const raw = process.env.WORKSPACE_STORAGE_LIMIT_BYTES;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 5 * 1000 * 1000 * 1000;
}

export type WorkspaceStorageWarning = {
  workspaceId: string;
  workspaceName: string;
  usedBytes: number;
  limitBytes: number;
  /** 0–100 */
  percentUsed: number;
};

async function sumFileSizesForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<number> {
  if (projectIds.length === 0) return 0;
  const chunkSize = 150;
  let total = 0;
  for (let i = 0; i < projectIds.length; i += chunkSize) {
    const chunk = projectIds.slice(i, i + chunkSize);
    const { data, error } = await supabase.from("project_files").select("file_size").in("project_id", chunk);
    if (error) continue;
    for (const row of data ?? []) {
      total += row.file_size ?? 0;
    }
  }
  return total;
}

/**
 * Summe der Dateigrößen (project_files) aller Projekte eines Workspaces.
 * Galerie-Fotos ohne project_files-Zeile sind nicht enthalten – später erweiterbar.
 */
export async function getWorkspaceUsedBytes(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<number> {
  const { data: projects, error } = await supabase.from("projects").select("id").eq("workspace_id", workspaceId);
  if (error || !projects?.length) return 0;
  const ids = projects.map((p) => p.id);
  return sumFileSizesForProjects(supabase, ids);
}

/**
 * Workspaces des Nutzers, deren Speicher ≥ Schwellenwert (75 %) des Limits ist.
 */
export async function getWorkspaceStorageWarningsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceStorageWarning[]> {
  const limitBytes = getWorkspaceStorageLimitBytes();
  const minUsed = Math.ceil(limitBytes * WORKSPACE_STORAGE_WARN_THRESHOLD);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isAppAdmin = profile?.role === "admin";

  type WsRow = { id: string; name: string };
  let workspaces: WsRow[] = [];

  if (isAppAdmin) {
    const { data: all } = await supabase.from("workspaces").select("id, name").order("name");
    workspaces = (all ?? []) as WsRow[];
  } else {
    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId);
    const ids = [...new Set((members ?? []).map((m) => m.workspace_id))];
    if (ids.length === 0) return [];
    const { data: wsRows } = await supabase.from("workspaces").select("id, name").in("id", ids);
    workspaces = (wsRows ?? []) as WsRow[];
  }

  const warnings: WorkspaceStorageWarning[] = [];

  for (const ws of workspaces) {
    const usedBytes = await getWorkspaceUsedBytes(supabase, ws.id);
    if (usedBytes < minUsed) continue;
    const percentUsed = Math.min(100, Math.round((usedBytes / limitBytes) * 1000) / 10);
    warnings.push({
      workspaceId: ws.id,
      workspaceName: ws.name,
      usedBytes,
      limitBytes,
      percentUsed,
    });
  }

  return warnings;
}
