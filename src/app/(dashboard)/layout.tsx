import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getDashboardSession } from "@/lib/auth/cachedDashboardSession";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceStorageWarningsForUser } from "@/lib/workspaceStorageQuota";
import { buildProjectLabelMap } from "@/lib/projectLabelDefaults";
import { resolveAppEdition } from "@/lib/appEdition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  if (!session) {
    redirect("/login?redirectTo=" + encodeURIComponent("/projects"));
  }

  const { user, profile } = session;

  const supabase = await createClient();
  const [storageWarnings, globalLabelsRes] = await Promise.all([
    getWorkspaceStorageWarningsForUser(supabase, user.id),
    supabase.from("project_labels").select("key,label_de,label_en"),
  ]);
  const headerProjectLabels = buildProjectLabelMap(globalLabelsRes.data ?? []);
  const canEditGlobalLabels = profile?.role === "admin";
  const appEdition = await resolveAppEdition();

  return (
    <DashboardShell
      user={user}
      profile={profile}
      storageWarnings={storageWarnings}
      headerProjectLabels={headerProjectLabels}
      canEditGlobalLabels={canEditGlobalLabels}
      appEdition={appEdition}
    >
      {children}
    </DashboardShell>
  );
}
