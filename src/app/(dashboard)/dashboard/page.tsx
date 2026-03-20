import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import type { ProjectStatus } from "@/types/database";

// Lokale Typen, passend zu DashboardContent
type OpenTaskForDashboard = {
  id: string;
  title: string;
  due_date: string | null;
  priority: "niedrig" | "mittel" | "hoch" | "dringend";
  project_id: string;
  projects: { dev_number: string; product_name: string } | null;
}[];

type UpdateForDashboard = {
  id: string;
  project_id: string;
  change_summary: string;
  created_at: string;
  projects: { dev_number: string; product_name: string } | null;
}[];

const OPEN_TASKS_PREVIEW = 5;

export default async function DashboardPage() {
  const supabase = await createClient();
  // Session kommt aus dem Dashboard-Layout (getUser); hier keine zweite Auth-Runde.

  const { data: projectsRaw } = await supabase
    .from("projects")
    .select(
      "id, dev_number, product_name, status, updated_at, project_image_id, workspaces ( name )",
    )
    .order("updated_at", { ascending: false });

  const projectRows = projectsRaw || [];
  const projectIds = projectRows.map((p) => p.id);
  const thumbByProjectId: Record<string, string> = {};

  const projectFilesReq =
    projectIds.length > 0
      ? supabase
          .from("project_files")
          .select("id, project_id, created_at")
          .in("project_id", projectIds)
          .order("created_at", { ascending: true })
      : null;

  const openTasksCountReq = supabase
    .from("project_tasks")
    .select("*", { count: "exact", head: true })
    .eq("completed", false);

  const openTasksReq = supabase
    .from("project_tasks")
    .select(
      "id, title, due_date, priority, project_id, projects!inner (dev_number, product_name)",
    )
    .eq("completed", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(OPEN_TASKS_PREVIEW);

  const recentUpdatesReq = supabase
    .from("project_updates")
    .select(
      "id, change_summary, created_at, project_id, projects!inner (dev_number, product_name)",
    )
    .order("created_at", { ascending: false })
    .limit(8);

  const [projectFilesRes, { count: openTasksTotal }, { data: openTasks }, { data: recentUpdates }] =
    await Promise.all([
      projectFilesReq ?? Promise.resolve({ data: null as { id: string; project_id: string }[] | null }),
      openTasksCountReq,
      openTasksReq,
      recentUpdatesReq,
    ]);

  if (projectFilesRes.data) {
    for (const f of projectFilesRes.data) {
      if (!thumbByProjectId[f.project_id]) thumbByProjectId[f.project_id] = f.id;
    }
  }

  const projects = projectRows.map((p) => {
    const raw = p as {
      id: string;
      dev_number: string;
      product_name: string;
      status: ProjectStatus;
      updated_at: string;
      project_image_id: string | null;
      workspaces?: { name: string } | { name: string }[] | null;
    };
    const w = raw.workspaces;
    const workspaceName = Array.isArray(w) ? w[0]?.name : w?.name;
    return {
      id: raw.id,
      dev_number: raw.dev_number,
      product_name: raw.product_name,
      status: raw.status,
      updated_at: raw.updated_at,
      project_image_id: raw.project_image_id ?? thumbByProjectId[raw.id] ?? null,
      workspace_name: workspaceName ?? null,
    };
  });

  return (
    <DashboardContent
      projects={projects}
      // Supabase-Response auf den erwarteten Dashboard-Typ abbilden
      openTasks={openTasks as OpenTaskForDashboard | null}
      openTasksTotal={openTasksTotal ?? 0}
      recentUpdates={recentUpdates as UpdateForDashboard | null}
    />
  );
}
