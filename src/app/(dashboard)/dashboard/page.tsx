import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, dev_number, product_name, status, updated_at"
    )
    .order("updated_at", { ascending: false });

  const { data: openTasks } = await supabase
    .from("project_tasks")
    .select(
      "id, title, due_date, priority, project_id, projects (dev_number, product_name)"
    )
    .eq("completed", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

  const { data: recentUpdates } = await supabase
    .from("project_updates")
    .select(
      "id, change_summary, created_at, project_id, projects (dev_number, product_name)"
    )
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <DashboardContent
      projects={projects}
      openTasks={openTasks}
      recentUpdates={recentUpdates}
    />
  );
}
