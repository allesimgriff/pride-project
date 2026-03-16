"use client";

import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { History } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface Update {
  id: string;
  change_summary: string;
  changes: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface ProjectHistoryProps {
  updates: Update[];
}

export function ProjectHistory({ updates }: ProjectHistoryProps) {
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;
  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <History className="h-5 w-5" />
        {t("history.title")}
      </h2>
      <ul className="mt-4 space-y-3">
        {updates.slice(0, 15).map((update) => (
          <li
            key={update.id}
            className="rounded-lg border border-gray-100 bg-surface-50 p-3"
          >
            <p className="text-sm text-gray-900">{update.change_summary}</p>
            <p className="mt-1 text-xs text-gray-500">
              {update.profiles?.full_name ?? t("history.system")} ·{" "}
              {formatDistanceToNow(new Date(update.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </p>
          </li>
        ))}
      </ul>
      {updates.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("history.noChanges")}
        </p>
      )}
    </div>
  );
}
