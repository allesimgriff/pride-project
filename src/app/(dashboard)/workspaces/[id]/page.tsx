import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getWorkspaceDetailAction } from "@/app/actions/workspaces";
import { WorkspaceDetailClient } from "@/components/workspaces/WorkspaceDetailClient";
import { SetWorkspaceHeader } from "@/components/layout/SetWorkspaceHeader";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getWorkspaceDetailAction(id);
  if (detail.error || !detail.workspace) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SetWorkspaceHeader workspaceId={id} />
      <WorkspaceDetailClient
        workspaceId={id}
        initial={{
          workspace: detail.workspace,
          members: detail.members,
          invites: detail.invites,
          canManage: detail.canManage,
        }}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
