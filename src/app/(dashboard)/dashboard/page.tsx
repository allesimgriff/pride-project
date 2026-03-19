import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

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

  const { data: projectsRaw } = await supabase
    .from("projects")
    .select("id, dev_number, product_name, status, updated_at, project_image_id")
    .order("updated_at", { ascending: false });

  const projectRows = projectsRaw || [];
  const projectIds = projectRows.map((p) => p.id);
  const thumbByProjectId: Record<string, string> = {};

  if (projectIds.length > 0) {
    const { data: projectFiles } = await supabase
      .from("project_files")
      .select("id, project_id, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: true });

    (projectFiles || []).forEach((f) => {
      if (!thumbByProjectId[f.project_id]) thumbByProjectId[f.project_id] = f.id;
    });
  }

  const projects = projectRows.map((p) => ({
    ...p,
    project_image_id: p.project_image_id ?? thumbByProjectId[p.id] ?? null,
  }));

  const { count: openTasksTotal } = await supabase
    .from("project_tasks")
    .select("*", { count: "exact", head: true })
    .eq("completed", false);

  const { data: openTasks } = await supabase
    .from("project_tasks")
    .select("id, title, due_date, priority, project_id, projects!inner (dev_number, product_name)")
    .eq("completed", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(OPEN_TASKS_PREVIEW);

  const { data: recentUpdates } = await supabase
    .from("project_updates")
    .select(
      "id, change_summary, created_at, project_id, projects!inner (dev_number, product_name)"
    )
    .order("created_at", { ascending: false })
    .limit(8);

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
