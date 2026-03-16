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

  return (
    <div className="space-y-6">
      <ProjectsPageHeader />
      <ProjectsList projects={projects || []} categoryNames={categoryList || []} />
    </div>
  );
}
