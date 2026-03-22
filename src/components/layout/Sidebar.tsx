"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { primaryNavItems, isPrimaryNavActive } from "@/components/layout/navConfig";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed, lang, edition } = useApp();
  const t = getT(lang);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`flex h-16 items-center border-b border-gray-200 ${sidebarCollapsed ? "justify-center px-0" : "px-6"}`}
      >
        {!sidebarCollapsed && (
          <Link href="/projects" className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="text-primary-600">
              {edition === "handwerker" ? t("nav.brandHandwerker") : t("nav.brandPride")}
            </span>
          </Link>
        )}
        {sidebarCollapsed && (
          <span className="text-sm font-semibold text-primary-600">
            {edition === "handwerker" ? "H" : "P"}
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {primaryNavItems.map((item) => {
          const isActive = isPrimaryNavActive(pathname, item);
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
