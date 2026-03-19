"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { ProjectStatus } from "@/types/database";
import { FolderKanban, Clock, CheckSquare, ArrowRight, ImageIcon } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/layout/PageTitle";

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
  project_image_id: string | null;
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
  openTasksTotal: number;
  recentUpdates: UpdateRow[] | null;
}

export function DashboardContent({
  projects,
  openTasks,
  openTasksTotal,
  recentUpdates,
}: DashboardContentProps) {
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;

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
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <CheckSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t("dashboard.openTasks")}</p>
              <p className="text-2xl font-semibold text-gray-900">{openTasksTotal}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Clock className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t("dashboard.recentChanges")}</p>
              <p className="text-2xl font-semibold text-gray-900">{recentUpdates?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="card flex max-h-[70vh] flex-col p-6">
          <div className="shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.projectsRecent")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("dashboard.projectsRecentHint")}
            </p>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [-ms-overflow-style:auto] [scrollbar-gutter:stable]">
            <ul className="space-y-2">
              {(projects || []).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 transition hover:bg-gray-50"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      {p.project_image_id ? (
                        <Image
                          src={`/api/files/${p.project_image_id}/preview`}
                          alt=""
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {p.dev_number}
                          </p>
                          <p className="truncate text-sm text-gray-600">
                            {p.product_name}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                          {t(`status.${p.status}`)}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(p.updated_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {(!projects || projects.length === 0) && (
              <p className="py-6 text-center text-sm text-gray-500">
                {t("projects.noProjects")}
              </p>
            )}
          </div>
          <div className="shrink-0 border-t border-gray-100 pt-3 mt-3">
            <Link
              href="/projects"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t("dashboard.viewAllProjects")} →
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboard.openTasks")}
          </h2>
          <ul className="mt-4 space-y-2">
            {(openTasks || []).map((task) => (
              <li key={task.id}>
                <Link
                  href={`/projects/${task.project_id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1 text-sm text-gray-900">
                    {task.title}
                  </span>
                  {task.projects && (
                    <span className="hidden shrink-0 text-xs font-medium text-gray-500 sm:inline">
                      {task.projects.dev_number}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
          {(!openTasks || openTasks.length === 0) && (
            <p className="py-4 text-center text-sm text-gray-500">
              {t("dashboard.noOpenTasks")}
            </p>
          )}
          {openTasks &&
            openTasks.length > 0 &&
            openTasksTotal > openTasks.length && (
              <p className="mt-3 border-t border-gray-100 pt-3 text-center text-xs text-gray-500">
                {t("dashboard.openTasksPreviewNote")
                  .replace("{{shown}}", String(openTasks.length))
                  .replace("{{total}}", String(openTasksTotal))}{" "}
                <Link
                  href="/projects"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {t("dashboard.openTasksGoProjects")}
                </Link>
              </p>
            )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboard.recentChanges")}
          </h2>
          <ul className="mt-4 space-y-2">
            {(recentUpdates || []).map((update) => (
              <li key={update.id}>
                <Link
                  href={`/projects/${update.project_id}`}
                  className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:bg-gray-50"
                >
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
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
  );
}
