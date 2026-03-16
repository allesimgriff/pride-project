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
    .select("id, title, due_date, priority, project_id, projects!inner (dev_number, product_name)")
    .eq("completed", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

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
      recentUpdates={recentUpdates as UpdateForDashboard | null}
    />
  );
}
