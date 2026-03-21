"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeCategoryPrefix } from "@/lib/categoryPrefix";
import { canManageProjectAsAdmin } from "@/lib/workspacePermissions";

export async function getNextDevNumberAction(prefix: string, workspaceId: string) {
  const supabase = await createClient();
  const p = normalizeCategoryPrefix(prefix);
  if (!workspaceId?.trim() || !p) return { devNumber: `${p}_${new Date().getFullYear()}_001` };
  const year = new Date().getFullYear();
  const pattern = `${p}_${year}_%`;
  const { data } = await supabase
    .from("projects")
    .select("dev_number")
    .eq("workspace_id", workspaceId)
    .ilike("dev_number", pattern)
    .order("dev_number", { ascending: false })
    .limit(1);
  const last = data?.[0]?.dev_number;
  let next = 1;
  if (last) {
    const parts = last.split("_");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  const seq = String(next).padStart(3, "0");
  return { devNumber: `${p}_${year}_${seq}` };
}

export async function canManageWorkspaceCategoriesAction(
  workspaceId: string,
): Promise<{ canEdit: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { canEdit: false };
  const ok = await canManageProjectAsAdmin(supabase, user.id, workspaceId);
  return { canEdit: ok };
}

export async function updateWorkspaceCategoryAction(input: {
  workspaceId: string;
  categoryId: string;
  name: string;
  prefix: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };
  const ok = await canManageProjectAsAdmin(supabase, user.id, input.workspaceId);
  if (!ok) return { error: "Keine Berechtigung." };

  const name = input.name.trim();
  const prefix = normalizeCategoryPrefix(input.prefix);
  if (!name || !prefix) return { error: "Name und Präfix erforderlich." };

  const { data: row, error: fetchErr } = await supabase
    .from("project_categories")
    .select("id, prefix, workspace_id")
    .eq("id", input.categoryId)
    .maybeSingle();
  if (fetchErr || !row || row.workspace_id !== input.workspaceId) {
    return { error: "Kategorie nicht gefunden." };
  }

  const oldPrefix = row.prefix;
  if (oldPrefix !== prefix) {
    await supabase
      .from("projects")
      .update({ category: prefix })
      .eq("workspace_id", input.workspaceId)
      .eq("category", oldPrefix);
  }

  const { error } = await supabase
    .from("project_categories")
    .update({ name, prefix })
    .eq("id", input.categoryId)
    .eq("workspace_id", input.workspaceId);
  if (error) return { error: error.message };
  return { error: null };
}
