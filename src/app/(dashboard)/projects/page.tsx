import { createClient } from "@/lib/supabase/server";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, dev_number, product_name, category, status, updated_at, project_image_id"
    )
    .order("updated_at", { ascending: false });

  const { data: categoryList } = await supabase
    .from("project_categories")
    .select("name, prefix")
    .order("sort_order", { ascending: true });

  const projectRows = projects || [];

  // Wenn `project_image_id` bei Projekten noch leer ist, laden wir einmalig das erste File pro Projekt
  // (statt pro Karte im Browser erneut zu suchen).
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

  const projectsWithThumbs = projectRows.map((p) => ({
    ...p,
    project_image_id: p.project_image_id ?? thumbByProjectId[p.id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <ProjectsPageHeader />
      <ProjectsList projects={projectsWithThumbs} categoryNames={categoryList || []} />
    </div>
  );
}
