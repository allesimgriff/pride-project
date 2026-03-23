import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { PageTitle } from "@/components/layout/PageTitle";
import { redirect } from "next/navigation";
import { projectLabelRowsToMap } from "@/lib/projectLabelDefaults";
import { listMergedProjectLabelsForWorkspaceAction } from "@/app/actions/workspaceProjectLabels";
import { canEditWorkspaceLabels } from "@/lib/workspacePermissions";
import { SetWorkspaceHeader } from "@/components/layout/SetWorkspaceHeader";
import { resolveAppEdition } from "@/lib/appEdition";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspaces } = await supabase.from("workspaces").select("id, name").order("name");
  if (!workspaces?.length) {
    const edition = await resolveAppEdition();
    redirect(edition === "handwerker" ? "/projects" : "/workspaces");
  }

  const sp = await searchParams;
  const wsParam = typeof sp.workspace === "string" ? sp.workspace.trim() : "";
  const resolvedWorkspaceId =
    wsParam && workspaces.some((w) => w.id === wsParam) ? wsParam : workspaces[0].id;

  const { data: categories } = await supabase
    .from("project_categories")
    .select("id, name, prefix, sort_order, workspace_id")
    .order("sort_order", { ascending: true });

  const { data: mergedRows } = await listMergedProjectLabelsForWorkspaceAction(resolvedWorkspaceId);
  const projectLabels = projectLabelRowsToMap(mergedRows ?? []);

  const initialCanEditLabels = await canEditWorkspaceLabels(supabase, user.id, resolvedWorkspaceId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SetWorkspaceHeader workspaceId={resolvedWorkspaceId} />
      <PageTitle titleKey="newProject.title" subtitleKey="newProject.pageSubtitle" />
      <NewProjectForm
        workspaces={workspaces}
        categories={categories || []}
        canEdit={true}
        projectLabels={projectLabels}
        initialWorkspaceId={resolvedWorkspaceId}
        initialCanEditLabels={initialCanEditLabels}
      />
    </div>
  );
}
