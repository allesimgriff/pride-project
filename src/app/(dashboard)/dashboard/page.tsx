import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import type { ProjectStatus } from "@/types/database";
import { ACTIVE_PROJECT_STATUSES } from "@/lib/projectActiveStatus";
import { mapFirstFileIdByProjectId } from "@/lib/supabase/firstFileThumbs";

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
/** Nur die jüngsten Einträge fürs Dashboard (KPI „aktiv“ kommt per COUNT). */
const DASHBOARD_RECENT_PROJECTS_LIMIT = 35;

export default async function DashboardPage() {
  const supabase = await createClient();

  const openTasksCountReq = supabase
    .from("project_tasks")
    .select("*", { count: "exact", head: true })
    .eq("completed", false);

  const activeProjectsCountReq = supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .in("status", ACTIVE_PROJECT_STATUSES);

  const projectsListReq = supabase
    .from("projects")
    .select(
      "id, dev_number, product_name, status, updated_at, project_image_id, workspaces ( name )",
    )
    .order("updated_at", { ascending: false })
    .limit(DASHBOARD_RECENT_PROJECTS_LIMIT);

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

  const [
    { count: activeProjectsCount },
    { data: projectsRaw },
    { count: openTasksTotal },
    { data: openTasks },
    { data: recentUpdates },
  ] = await Promise.all([
    activeProjectsCountReq,
    projectsListReq,
    openTasksCountReq,
    openTasksReq,
    recentUpdatesReq,
  ]);

  const projectRows = projectsRaw || [];
  const projectIds = projectRows.map((p) => p.id);
  const thumbByProjectId = await mapFirstFileIdByProjectId(supabase, projectIds);

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
      activeProjectsCount={activeProjectsCount ?? 0}
      openTasks={openTasks as OpenTaskForDashboard | null}
      openTasksTotal={openTasksTotal ?? 0}
      recentUpdates={recentUpdates as UpdateForDashboard | null}
    />
  );
}
