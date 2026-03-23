"use client";

import { AppProvider } from "@/components/providers/AppProvider";
import { PageTitle } from "@/components/layout/PageTitle";
import { JoinWorkspaceClient } from "@/components/workspaces/JoinWorkspaceClient";
import type { AppEdition } from "@/lib/appEdition";

/** Öffentliche Join-Seite: AppProvider nötig für PageTitle / JoinWorkspaceClient (useApp). */
export function JoinWorkspaceShell({
  edition,
  isLoggedIn,
}: {
  edition: AppEdition;
  isLoggedIn: boolean;
}) {
  return (
    <AppProvider edition={edition}>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <PageTitle titleKey="workspaces.joinTitle" subtitleKey="workspaces.joinDescription" />
        <JoinWorkspaceClient isLoggedIn={isLoggedIn} />
      </div>
    </AppProvider>
  );
}
