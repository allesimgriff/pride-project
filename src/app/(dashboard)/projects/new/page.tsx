import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { PageTitle } from "@/components/layout/PageTitle";
import { redirect } from "next/navigation";
import { buildProjectLabelMap } from "@/lib/projectLabelDefaults";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("project_categories")
    .select("name, prefix")
    .order("sort_order", { ascending: true });

  const { data: labelsRaw } = await supabase
    .from("project_labels")
    .select("key,label_de,label_en");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const canEdit = profile?.role === "admin";
  const projectLabels = buildProjectLabelMap(labelsRaw || []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle titleKey="newProject.title" subtitleKey="newProject.pageSubtitle" />
      <NewProjectForm categories={categories || []} canEdit={canEdit} projectLabels={projectLabels} />
    </div>
  );
}
