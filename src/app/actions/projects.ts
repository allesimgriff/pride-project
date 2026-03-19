"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types/database";

export async function createProjectAction(data: {
  dev_number: string;
  product_name: string;
  category?: string | null;
  customer_market_country?: string | null;
  responsible_id?: string | null;
  status?: ProjectStatus;
  description?: string | null;
  technical_data?: Record<string, unknown>;
  functions?: string | null;
  materials?: string | null;
  open_points?: string | null;
}) {
  const supabase = await createClient();
  if (!data.dev_number.trim()) return { error: "Entwicklungsnummer erforderlich", id: null };
  if (!data.product_name.trim()) return { error: "Produktname erforderlich", id: null };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet", id: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return { error: "Nur Admin darf Projekte und Dokumentation anlegen.", id: null };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      dev_number: data.dev_number.trim(),
      product_name: data.product_name.trim(),
      category: data.category || null,
      customer_market_country: data.customer_market_country || null,
      responsible_id: data.responsible_id || null,
      status: data.status ?? "idee",
      description: data.description || null,
      technical_data: data.technical_data ?? {},
      functions: data.functions || null,
      materials: data.materials || null,
      open_points: data.open_points || null,
      created_by: null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message, id: null };

  // Eintrag in der Historie ist nett, aber nicht zwingend:
  await supabase.from("project_updates").insert({
    project_id: project.id,
    author_id: null,
    change_summary: "Projekt angelegt",
    changes: { dev_number: data.dev_number, product_name: data.product_name },
  });

  return { id: project.id };
}

export async function updateProjectAction(
  id: string,
  data: {
    product_name?: string;
    category?: string | null;
    customer_market_country?: string | null;
    responsible_id?: string | null;
    status?: ProjectStatus;
    description?: string | null;
    technical_data?: Record<string, unknown>;
    functions?: string | null;
    materials?: string | null;
    open_points?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return { error: "Nur Admin darf Projekte bearbeiten." };
  }

  const { error } = await supabase.from("projects").update(data).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("project_updates").insert({
    project_id: id,
    author_id: user.id,
    change_summary: "Stammdaten aktualisiert",
    changes: data as Record<string, unknown>,
  });

  return {};
}

export async function addCommentAction(projectId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };
  if (!content.trim()) return { error: "Kommentar darf nicht leer sein" };

  const { error } = await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: user.id,
    content: content.trim(),
  });
  if (error) return { error: error.message };
  return {};
}

export async function addTaskAction(
  projectId: string,
  data: {
    title: string;
    description?: string | null;
    responsible_id?: string | null;
    priority?: "niedrig" | "mittel" | "hoch" | "dringend";
    due_date?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };
  if (!data.title.trim()) return { error: "Titel erforderlich" };

  const { error } = await supabase.from("project_tasks").insert({
    project_id: projectId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    responsible_id: data.responsible_id || null,
    priority: data.priority ?? "mittel",
    due_date: data.due_date || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  return {};
}

export async function addTasksBulkAction(
  projectId: string,
  titles: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const cleaned = titles
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 300);

  if (cleaned.length === 0) return { error: "Keine Aufgaben erkannt." };

  const rows = cleaned.map((title) => ({
    project_id: projectId,
    title,
    description: null,
    responsible_id: null,
    priority: "mittel" as const,
    due_date: null,
    created_by: user.id,
  }));

  const { error } = await supabase.from("project_tasks").insert(rows);
  if (error) return { error: error.message };
  return { count: rows.length };
}

export async function toggleTaskAction(taskId: string, completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) return { error: error.message };
  return {};
}

export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Nur Admins dürfen Projekte löschen." };
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };
  return {};
}

export async function setProjectImageAction(projectId: string, fileId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ project_image_id: fileId })
    .eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}
