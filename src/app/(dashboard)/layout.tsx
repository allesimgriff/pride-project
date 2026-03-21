import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getDashboardSession } from "@/lib/auth/cachedDashboardSession";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceStorageWarningsForUser } from "@/lib/workspaceStorageQuota";

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
  const storageWarnings = await getWorkspaceStorageWarningsForUser(supabase, user.id);

  return (
    <DashboardShell user={user} profile={profile} storageWarnings={storageWarnings}>
      {children}
    </DashboardShell>
  );
}
