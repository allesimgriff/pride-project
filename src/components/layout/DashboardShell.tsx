"use client";

import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { AppProvider, useApp } from "@/components/providers/AppProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { HeaderWorkspaceProvider } from "@/components/layout/HeaderWorkspaceContext";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { WorkspaceStorageWarningBanner } from "@/components/layout/WorkspaceStorageWarningBanner";
import type { WorkspaceStorageWarning } from "@/lib/workspaceStorageQuota";
import type { ProjectLabelMap } from "@/lib/projectLabelDefaults";
import type { AppEdition } from "@/lib/appEdition";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
  storageWarnings?: WorkspaceStorageWarning[];
  headerProjectLabels: ProjectLabelMap;
  canEditGlobalLabels: boolean;
  appEdition: AppEdition;
}

export function DashboardShell({
  children,
  user,
  profile,
  storageWarnings = [],
  headerProjectLabels,
  canEditGlobalLabels,
  appEdition,
}: DashboardShellProps) {
  return (
    <AppProvider edition={appEdition}>
      <HeaderWorkspaceProvider>
      <NavigationProgress />
      <div className="flex min-h-screen bg-surface-100">
        {/* Desktop: feste Sidebar links */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <MainBlock
          user={user}
          profile={profile}
          storageWarnings={storageWarnings}
          headerProjectLabels={headerProjectLabels}
          canEditGlobalLabels={canEditGlobalLabels}
        >
          {children}
        </MainBlock>
      </div>
      </HeaderWorkspaceProvider>
    </AppProvider>
  );
}

function MainBlock({
  children,
  user,
  profile,
  storageWarnings,
  headerProjectLabels,
  canEditGlobalLabels,
}: {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
  storageWarnings: WorkspaceStorageWarning[];
  headerProjectLabels: ProjectLabelMap;
  canEditGlobalLabels: boolean;
}) {
  const { sidebarCollapsed } = useApp();
  return (
    <div
      className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${
        // Desktop: Platz für Sidebar, Mobile: volle Breite
        sidebarCollapsed ? "md:pl-16" : "md:pl-64"
      }`}
    >
      <Header
        user={user}
        profile={profile}
        headerProjectLabels={headerProjectLabels}
        canEditGlobalLabels={canEditGlobalLabels}
      />
      <WorkspaceStorageWarningBanner warnings={storageWarnings} />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
