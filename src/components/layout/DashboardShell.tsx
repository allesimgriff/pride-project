"use client";

import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { AppProvider, useApp } from "@/components/providers/AppProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { WorkspaceStorageWarningBanner } from "@/components/layout/WorkspaceStorageWarningBanner";
import type { WorkspaceStorageWarning } from "@/lib/workspaceStorageQuota";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
  storageWarnings?: WorkspaceStorageWarning[];
}

export function DashboardShell({ children, user, profile, storageWarnings = [] }: DashboardShellProps) {
  return (
    <AppProvider>
      <NavigationProgress />
      <div className="flex min-h-screen bg-surface-100">
        {/* Desktop: feste Sidebar links */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <MainBlock user={user} profile={profile} storageWarnings={storageWarnings}>
          {children}
        </MainBlock>
      </div>
    </AppProvider>
  );
}

function MainBlock({
  children,
  user,
  profile,
  storageWarnings,
}: {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
  storageWarnings: WorkspaceStorageWarning[];
}) {
  const { sidebarCollapsed } = useApp();
  return (
    <div
      className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${
        // Desktop: Platz für Sidebar, Mobile: volle Breite
        sidebarCollapsed ? "md:pl-16" : "md:pl-64"
      }`}
    >
      <Header user={user} profile={profile} />
      <WorkspaceStorageWarningBanner warnings={storageWarnings} />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
