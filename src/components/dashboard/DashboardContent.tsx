"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { ProjectStatus } from "@/types/database";
import {
  FolderKanban,
  Clock,
  CheckSquare,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/layout/PageTitle";

const STATUS_ORDER: ProjectStatus[] = [
  "idee",
  "konzept",
  "entwicklung",
  "muster",
  "freigabe",
  "abgeschlossen",
  "archiviert",
];

const ACTIVE_STATUSES: ProjectStatus[] = [
  "idee",
  "konzept",
  "entwicklung",
  "muster",
  "freigabe",
];

type ProjectRow = {
  id: string;
  dev_number: string;
  product_name: string;
  status: ProjectStatus;
  updated_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  project_id: string;
  projects: { dev_number: string; product_name: string } | null;
};

type UpdateRow = {
  id: string;
  project_id: string;
  change_summary: string;
  created_at: string;
  projects: { dev_number: string; product_name: string } | null;
};

interface DashboardContentProps {
  projects: ProjectRow[] | null;
  openTasks: TaskRow[] | null;
  recentUpdates: UpdateRow[] | null;
}

export function DashboardContent({
  projects,
  openTasks,
  recentUpdates,
}: DashboardContentProps) {
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;

  const byStatus = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = (projects || []).filter((p) => p.status === status);
      return acc;
    },
    {} as Record<ProjectStatus, ProjectRow[]>
  );

  const activeCount =
    projects?.filter((p) => ACTIVE_STATUSES.includes(p.status)).length ?? 0;

  return (
    <div className="space-y-8">
      <PageTitle titleKey="dashboard.title" subtitleKey="dashboard.subtitle" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Link
          href="/projects"
          className="card p-5 block hover:bg-primary-50/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <FolderKanban className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("dashboard.activeProjects")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </Link>
        <a
          href="#open-tasks"
          className="card p-5 block hover:bg-primary-50/40 transition-colors"
          aria-label={t("dashboard.openTasks")}
          title={t("dashboard.openTasks")}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <CheckSquare className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("dashboard.openTasks")}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {openTasks?.length ?? 0}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </a>

        <a
          href="#recent-changes"
          className="card p-5 block hover:bg-primary-50/40 transition-colors"
          aria-label={t("dashboard.recentChanges")}
          title={t("dashboard.recentChanges")}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("dashboard.recentChanges")}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {recentUpdates?.length ?? 0}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboard.projectsByStatus")}
          </h2>
          <div className="mt-4 space-y-3">
            {ACTIVE_STATUSES.map((status) => {
              const list = byStatus[status] || [];
              if (list.length === 0) return null;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-surface-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {t(`status.${status}`)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {list.length}{" "}
                      {list.length === 1
                        ? t("dashboard.project")
                        : t("dashboard.projects")}
                    </span>
                    <Link
                      href={`/projects?status=${status}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      {t("dashboard.show")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div id="open-tasks" className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.openTasks")}
            </h2>
            <ul className="mt-4 space-y-2">
              {(openTasks || []).slice(0, 5).map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/projects/${task.project_id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-900">{task.title}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {task.projects && (
                        <span>{task.projects.dev_number}</span>
                      )}
                      {task.due_date && (
                        <span>
                          {formatDistanceToNow(new Date(task.due_date), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {(!openTasks || openTasks.length === 0) && (
              <p className="py-4 text-center text-sm text-gray-500">
                {t("dashboard.noOpenTasks")}
              </p>
            )}
          </div>

          <div id="recent-changes" className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.recentChanges")}
            </h2>
            <ul className="mt-4 space-y-2">
              {(recentUpdates || []).map((update) => (
                <li key={update.id}>
                  <Link
                    href={`/projects/${update.project_id}`}
                    className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">
                        {update.change_summary}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {update.projects?.dev_number} ·{" "}
                        {formatDistanceToNow(new Date(update.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {(!recentUpdates || recentUpdates.length === 0) && (
              <p className="py-4 text-center text-sm text-gray-500">
                {t("dashboard.noChanges")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
