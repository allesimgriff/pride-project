"use client";

import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { History } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { ProjectLabelMap } from "@/lib/projectLabelDefaults";
import { EditableProjectLabel } from "@/components/projects/EditableProjectLabel";

interface Update {
  id: string;
  change_summary: string;
  changes: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface ProjectHistoryProps {
  updates: Update[];
  projectLabels: ProjectLabelMap;
  workspaceId: string | null;
  canEditLabels: boolean;
}

export function ProjectHistory({
  updates,
  projectLabels,
  workspaceId,
  canEditLabels,
}: ProjectHistoryProps) {
  const { lang } = useApp();
  const t = getT(lang);
  const labelNrTitle =
    lang === "de"
      ? "Entspricht der Spalte „Nr.“ unter Überschriften für diesen Workspace"
      : "Matches the “Nr.” column under headings for this workspace";
  const dateLocale = lang === "de" ? de : enUS;
  return (
    <div className="card p-6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900">
        <History className="h-5 w-5 shrink-0" />
        <EditableProjectLabel
          labelKey="historyHeading"
          fallback={t("history.title")}
          workspaceId={workspaceId}
          projectLabels={projectLabels}
          canEdit={canEditLabels}
          showNr
          nrTitle={labelNrTitle}
          textClassName="text-lg font-semibold text-gray-900"
        />
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
