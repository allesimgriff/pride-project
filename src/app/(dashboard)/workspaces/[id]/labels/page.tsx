import { notFound, redirect } from "next/navigation";
import { getWorkspaceDetailAction } from "@/app/actions/workspaces";
import { listMergedProjectLabelsForWorkspaceAction } from "@/app/actions/workspaceProjectLabels";
import { WorkspaceProjectLabelsManager } from "@/components/workspaces/WorkspaceProjectLabelsManager";
import { BackToWorkspaceLink } from "@/components/workspaces/BackToWorkspaceLink";
import { PageTitle } from "@/components/layout/PageTitle";

export default async function WorkspaceLabelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getWorkspaceDetailAction(id);
  if (detail.error || !detail.workspace) {
    notFound();
  }
  if (!detail.canManage) {
    redirect(`/workspaces/${id}`);
  }

  const { data: labels } = await listMergedProjectLabelsForWorkspaceAction(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print">
        <BackToWorkspaceLink workspaceId={id} />
      </div>
      <PageTitle titleKey="workspaces.labelsTitle" subtitleKey="workspaces.labelsSubtitle" />
      <WorkspaceProjectLabelsManager
        workspaceId={id}
        workspaceName={detail.workspace.name}
        labels={labels ?? []}
      />
    </div>
  );
}
