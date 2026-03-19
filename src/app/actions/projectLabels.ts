"use server";

import { createClient } from "@/lib/supabase/server";
import { PROJECT_LABEL_DEFAULTS, type ProjectLabelKey, type ProjectLabelRow } from "@/lib/projectLabelDefaults";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function listProjectLabelsAction(): Promise<{ data: ProjectLabelRow[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_labels")
    .select("key,label_de,label_en,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    // Fallback: wenn Tabelle noch nicht existiert oder leer ist, Defaults zeigen
    return { data: PROJECT_LABEL_DEFAULTS, error: null };
  }

  if (!data || data.length === 0) {
    return { data: PROJECT_LABEL_DEFAULTS, error: null };
  }

  const valid = data.filter((row) => PROJECT_LABEL_DEFAULTS.some((d) => d.key === row.key));
  return {
    data: (valid.length > 0 ? valid : PROJECT_LABEL_DEFAULTS) as ProjectLabelRow[],
    error: null,
  };
}

export async function saveProjectLabelAction(input: {
  key: ProjectLabelKey;
  label_de: string;
  label_en: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return { error: "Nur Admin darf Überschriften bearbeiten." };

  const key = input.key;
  const label_de = input.label_de.trim();
  const label_en = input.label_en.trim();
  if (!label_de || !label_en) {
    return { error: "DE und EN dürfen nicht leer sein." };
  }

  const sort = PROJECT_LABEL_DEFAULTS.find((d) => d.key === key)?.sort_order ?? 999;

  const { error } = await supabase.from("project_labels").upsert(
    {
      key,
      label_de,
      label_en,
      sort_order: sort,
      updated_by: admin.id,
    },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };

  return { error: null };
}

