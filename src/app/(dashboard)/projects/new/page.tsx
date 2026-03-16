import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { PageTitle } from "@/components/layout/PageTitle";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("project_categories")
    .select("name, prefix")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle titleKey="newProject.title" subtitleKey="newProject.pageSubtitle" />
      <NewProjectForm categories={categories || []} />
    </div>
  );
}
