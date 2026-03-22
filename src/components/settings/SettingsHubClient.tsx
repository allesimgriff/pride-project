"use client";

import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function SettingsHubClient({ isAdmin }: { isAdmin: boolean }) {
  const { lang, edition } = useApp();
  const t = getT(lang);

  const tiles: {
    href: string;
    labelKey: string;
    descKey: string;
    icon: typeof Building2;
    adminOnly?: boolean;
    prideOnly?: boolean;
  }[] = [
    {
      href: "/workspaces",
      labelKey: "nav.workspaces",
      descKey: "settingsHub.workspacesDesc",
      icon: Building2,
      prideOnly: true,
    },
    {
      href: "/settings/staff",
      labelKey: "nav.staff",
      descKey: "settingsHub.staffDesc",
      icon: Users,
      adminOnly: true,
    },
  ];

  const visible = tiles.filter((x) => {
    if (x.prideOnly && edition === "handwerker") return false;
    if (x.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t("settingsHub.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("settingsHub.subtitle")}</p>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-gray-600">
          {t("settingsHub.handwerkerEmpty")}
          {" "}
          <Link href="/settings/profile" className="font-medium text-primary-600 hover:text-primary-800">
            {t("nav.profile")}
          </Link>
        </p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {visible.map((tile) => {
          const Icon = tile.icon;
          return (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="card flex items-start gap-4 p-5 transition-colors hover:bg-gray-50/80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{t(tile.labelKey)}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{t(tile.descKey)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
