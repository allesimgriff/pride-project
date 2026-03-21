"use client";

import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { AppProvider, useApp } from "@/components/providers/AppProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
}

export function DashboardShell({ children, user, profile }: DashboardShellProps) {
  return (
    <AppProvider>
      <NavigationProgress />
      <div className="flex min-h-screen bg-surface-100">
        {/* Desktop: feste Sidebar links */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <MainBlock user={user} profile={profile}>
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
}: {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
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
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
