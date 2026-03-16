"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

const nav = (isAdmin: boolean) => {
  const items: { href: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { href: "/projects", labelKey: "nav.projects", icon: FolderKanban },
    { href: "/settings/profile", labelKey: "nav.profile", icon: User },
  ];
  if (isAdmin) {
    items.push({ href: "/settings/categories", labelKey: "nav.categories", icon: Settings });
  }
  return items;
};

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed, lang } = useApp();
  const t = getT(lang);
  const navItems = nav(isAdmin);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`flex h-16 items-center border-b border-gray-200 ${sidebarCollapsed ? "justify-center px-0" : "px-6"}`}>
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="text-primary-600">PRIDE</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <span className="text-primary-600 font-semibold text-sm">P</span>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/settings/categories" && item.href !== "/settings/profile" && pathname.startsWith(item.href)) ||
            (item.href === "/settings/categories" && pathname.startsWith("/settings/categories")) ||
            (item.href === "/settings/profile" && pathname.startsWith("/settings/profile"));
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={label}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              } ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-2">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${
            sidebarCollapsed ? "justify-center" : "gap-3"
          }`}
          title={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!sidebarCollapsed && <span>{t("sidebar.collapse")}</span>}
        </button>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.refresh();
            window.location.href = "/login";
          }}
          title={t("nav.signOut")}
          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${
            sidebarCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogOut className="h-5 w-5" />
          {!sidebarCollapsed && <span>{t("nav.signOut")}</span>}
        </button>
      </div>
    </aside>
  );
}
