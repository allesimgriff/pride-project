import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getDashboardSession } from "@/lib/auth/cachedDashboardSession";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  if (!session) {
    redirect("/login?redirectTo=" + encodeURIComponent("/dashboard"));
  }

  const { user, profile } = session;

  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  );
}
