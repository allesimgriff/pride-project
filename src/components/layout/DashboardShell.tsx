"use client";

import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { AppProvider, useApp } from "@/components/providers/AppProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface DashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
  user: User;
  profile: Profile | null;
}

export function DashboardShell({ children, isAdmin, user, profile }: DashboardShellProps) {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-surface-100">
        <Sidebar isAdmin={isAdmin} />
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
        sidebarCollapsed ? "pl-16" : "pl-64"
      }`}
    >
      <Header user={user} profile={profile} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
