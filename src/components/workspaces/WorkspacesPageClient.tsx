"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { CreateWorkspaceCard } from "./CreateWorkspaceCard";

export function WorkspacesPageClient({ workspaces }: { workspaces: { id: string; name: string }[] }) {
  const { lang } = useApp();
  const t = getT(lang);

  return (
    <div className="space-y-6">
      {workspaces.length === 0 ? (
        <p className="text-sm text-gray-600">{t("workspaces.empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {workspaces.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium text-gray-900">{w.name}</span>
              <Link href={`/workspaces/${w.id}`} className="btn-secondary text-sm">
                {t("workspaces.open")}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <CreateWorkspaceCard />
    </div>
  );
}
