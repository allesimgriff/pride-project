import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { PageTitle } from "@/components/layout/PageTitle";
import { redirect } from "next/navigation";
import { projectLabelRowsToMap } from "@/lib/projectLabelDefaults";
import { listMergedProjectLabelsForWorkspaceAction } from "@/app/actions/workspaceProjectLabels";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspaces } = await supabase.from("workspaces").select("id, name").order("name");
  if (!workspaces?.length) redirect("/workspaces");

  const { data: categories } = await supabase
    .from("project_categories")
    .select("name, prefix")
    .order("sort_order", { ascending: true });

  const firstWs = workspaces[0].id;
  const { data: mergedRows } = await listMergedProjectLabelsForWorkspaceAction(firstWs);
  const projectLabels = projectLabelRowsToMap(mergedRows ?? []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle titleKey="newProject.title" subtitleKey="newProject.pageSubtitle" />
      <NewProjectForm
        workspaces={workspaces}
        categories={categories || []}
        canEdit={true}
        projectLabels={projectLabels}
      />
    </div>
  );
}
