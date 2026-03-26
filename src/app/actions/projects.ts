"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types/database";
import { canManageProjectAsAdmin } from "@/lib/workspacePermissions";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseHttpsApiUrlForServer,
  getSupabaseServiceRoleKeyForServer,
} from "@/lib/supabase/public-env";

function objectPathFromLegacyPhotoUrl(imageUrl: string) {
  const bucketPrefix = "project-photos/";
  return imageUrl.startsWith(bucketPrefix) ? imageUrl.slice(bucketPrefix.length) : imageUrl;
}

export async function createProjectAction(data: {
  workspace_id: string;
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
  if (!data.workspace_id?.trim()) return { error: "Workspace erforderlich", id: null };
  if (!data.dev_number.trim()) return { error: "Entwicklungsnummer erforderlich", id: null };
  if (!data.product_name.trim()) return { error: "Produktname erforderlich", id: null };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet", id: null };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: data.workspace_id.trim(),
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
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message, id: null };

  // Eintrag in der Historie ist nett, aber nicht zwingend:
  await supabase.from("project_updates").insert({
    project_id: project.id,
    author_id: user.id,
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

  const { data: proj } = await supabase.from("projects").select("workspace_id").eq("id", id).single();
  if (!proj) return { error: "Projekt nicht gefunden." };

  if (!(await canManageProjectAsAdmin(supabase, user.id, proj.workspace_id))) {
    return { error: "Nur Workspace- oder App-Admin dürfen Stammdaten bearbeiten." };
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
    image_file_id?: string | null;
    image_photo_id?: string | null;
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
    image_file_id: data.image_file_id || null,
    image_photo_id: data.image_photo_id || null,
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

export async function updateTaskAction(
  taskId: string,
  data: {
    title: string;
    description?: string | null;
    image_file_id?: string | null;
    image_photo_id?: string | null;
    priority?: "niedrig" | "mittel" | "hoch" | "dringend";
    due_date?: string | null;
  }
) {
  const supabase = await createClient();
  if (!data.title.trim()) return { error: "Titel erforderlich" };

  const { error } = await supabase
    .from("project_tasks")
    .update({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      image_file_id: data.image_file_id || null,
      image_photo_id: data.image_photo_id || null,
      priority: data.priority ?? "mittel",
      due_date: data.due_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) return { error: error.message };
  return {};
}

export async function moveProjectToWorkspaceAction(
  projectId: string,
  targetWorkspaceId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const tid = targetWorkspaceId.trim();
  if (!tid) return { error: "Ziel-Workspace erforderlich." };

  const { data: proj, error: pErr } = await supabase
    .from("projects")
    .select("workspace_id, dev_number")
    .eq("id", projectId)
    .single();

  if (pErr || !proj) return { error: "Projekt nicht gefunden." };
  if (proj.workspace_id === tid) return { error: null };

  const canSource = await canManageProjectAsAdmin(supabase, user.id, proj.workspace_id);
  const canTarget = await canManageProjectAsAdmin(supabase, user.id, tid);
  if (!canSource || !canTarget) {
    return {
      error:
        "Keine Berechtigung: Quell- und Ziel-Workspace erfordern Workspace- oder App-Admin.",
    };
  }

  const { data: clash } = await supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", tid)
    .eq("dev_number", proj.dev_number)
    .neq("id", projectId)
    .maybeSingle();

  if (clash) {
    return {
      error: "Diese Entwicklungsnummer gibt es im Ziel-Workspace schon.",
    };
  }

  const { error: uErr } = await supabase
    .from("projects")
    .update({ workspace_id: tid })
    .eq("id", projectId);

  if (uErr) {
    const m = uErr.message.toLowerCase();
    if (m.includes("unique") || m.includes("duplicate")) {
      return {
        error: "Diese Entwicklungsnummer gibt es im Ziel-Workspace schon.",
      };
    }
    return { error: uErr.message };
  }

  await supabase.from("project_updates").insert({
    project_id: projectId,
    author_id: user.id,
    change_summary: "In anderen Workspace verschoben",
    changes: { workspace_id: tid },
  });

  return { error: null };
}

export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: proj } = await supabase.from("projects").select("workspace_id").eq("id", projectId).single();
  if (!proj) return { error: "Projekt nicht gefunden." };

  if (!(await canManageProjectAsAdmin(supabase, user.id, proj.workspace_id))) {
    return { error: "Nur Workspace- oder App-Admin dürfen Projekte löschen." };
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: proj } = await supabase.from("projects").select("workspace_id").eq("id", projectId).single();
  if (!proj) return { error: "Projekt nicht gefunden." };

  if (!(await canManageProjectAsAdmin(supabase, user.id, proj.workspace_id))) {
    return { error: "Nur Workspace- oder App-Admin dürfen das Projektbild setzen." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ project_image_id: fileId })
    .eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}

export async function deleteProjectFileAction(fileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: file, error: fileError } = await supabase
    .from("project_files")
    .select("id, project_id, uploaded_by, file_path, file_name")
    .eq("id", fileId)
    .single();
  if (fileError || !file) return { error: "Datei nicht gefunden." };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, workspace_id, project_image_id")
    .eq("id", file.project_id)
    .single();
  if (projectError || !project) return { error: "Projekt nicht gefunden." };

  const canAdmin = await canManageProjectAsAdmin(supabase, user.id, project.workspace_id);
  const isUploader = file.uploaded_by === user.id;
  if (!canAdmin && !isUploader) {
    return { error: "Keine Berechtigung zum Löschen dieser Datei." };
  }

  const supabaseUrl = getSupabaseHttpsApiUrlForServer();
  const serviceRoleKey = getSupabaseServiceRoleKeyForServer();
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server-Konfiguration fehlt (SUPABASE_SERVICE_ROLE_KEY)." };
  }

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: storageError } = await admin.storage
    .from("project-files")
    .remove([file.file_path]);
  if (storageError) return { error: `Storage-Fehler: ${storageError.message}` };

  const { error: deleteError } = await admin.from("project_files").delete().eq("id", file.id);
  if (deleteError) return { error: deleteError.message };

  if (project.project_image_id === file.id) {
    await admin.from("projects").update({ project_image_id: null }).eq("id", project.id);
  }

  await supabase.from("project_updates").insert({
    project_id: project.id,
    author_id: user.id,
    change_summary: "Datei gelöscht",
    changes: { file_id: file.id, file_name: file.file_name },
  });

  return {};
}

export async function deleteLegacyProjectPhotoAction(projectId: string, photoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .eq("id", projectId)
    .single();
  if (projectError || !project) return { error: "Projekt nicht gefunden." };

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id, user_id, image_url")
    .eq("id", photoId)
    .single();
  if (photoError || !photo) return { error: "Foto nicht gefunden." };

  const canAdmin = await canManageProjectAsAdmin(supabase, user.id, project.workspace_id);
  const isOwner = photo.user_id === user.id;
  if (!canAdmin && !isOwner) {
    return { error: "Keine Berechtigung zum Löschen dieses Fotos." };
  }

  const supabaseUrl = getSupabaseHttpsApiUrlForServer();
  const serviceRoleKey = getSupabaseServiceRoleKeyForServer();
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server-Konfiguration fehlt (SUPABASE_SERVICE_ROLE_KEY)." };
  }

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const objectPath = objectPathFromLegacyPhotoUrl(photo.image_url);
  const { error: storageError } = await admin.storage.from("project-photos").remove([objectPath]);
  if (storageError) return { error: `Storage-Fehler: ${storageError.message}` };

  const { error: deleteError } = await admin.from("photos").delete().eq("id", photo.id);
  if (deleteError) return { error: deleteError.message };

  await supabase.from("project_updates").insert({
    project_id: project.id,
    author_id: user.id,
    change_summary: "Foto gelöscht",
    changes: { photo_id: photo.id },
  });

  return {};
}
