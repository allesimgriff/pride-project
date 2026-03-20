import { Suspense } from "react";
import { PageTitle } from "@/components/layout/PageTitle";
import { JoinWorkspaceClient } from "@/components/workspaces/JoinWorkspaceClient";

export default function JoinWorkspacePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle titleKey="workspaces.joinTitle" subtitleKey="workspaces.joinDescription" />
      <Suspense fallback={<div className="card p-6 text-sm text-gray-500">…</div>}>
        <JoinWorkspaceClient />
      </Suspense>
    </div>
  );
}
