"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCategoriesAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return { error: error.message, data: null };
  return { data, error: null };
}

/** Nächste freie Entwicklungsnummer für einen Präfix (z. B. PM_Chairs_2025_001). */
export async function getNextDevNumberAction(prefix: string) {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const pattern = `${prefix}_${year}_%`;
  const { data } = await supabase
    .from("projects")
    .select("dev_number")
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
  return { devNumber: `${prefix}_${year}_${seq}` };
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function createCategoryAction(name: string, prefix: string) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Nur Admin darf Kategorien anlegen." };

  const { error } = await supabase.from("project_categories").insert({
    name: name.trim(),
    prefix: prefix.trim(),
    sort_order: 999,
  });
  if (error) return { error: error.message };
  return {};
}

export async function updateCategoryAction(id: string, name: string, prefix: string) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Nur Admin darf Kategorien bearbeiten." };

  const { error } = await supabase
    .from("project_categories")
    .update({ name: name.trim(), prefix: prefix.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Nur Admin darf Kategorien löschen." };

  const { error } = await supabase.from("project_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}
