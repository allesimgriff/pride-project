"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { ProjectStatus } from "@/types/database";
import { ArrowRight, FileText, ImageIcon } from "lucide-react";

interface ProjectRow {
  id: string;
  workspace_id: string;
  dev_number: string;
  product_name: string;
  category: string | null;
  status: ProjectStatus;
  updated_at: string;
  project_image_id: string | null;
  workspace_name: string | null;
}

interface ProjectsListProps {
  projects: ProjectRow[];
  categoriesByWorkspace?: Record<string, { name: string; prefix: string }[]>;
}

function StatusBadge({ status, label }: { status: ProjectStatus; label: string }) {
  const styles: Record<ProjectStatus, string> = {
    idee: "bg-gray-100 text-gray-700",
    konzept: "bg-blue-100 text-blue-800",
    entwicklung: "bg-amber-100 text-amber-800",
    muster: "bg-violet-100 text-violet-800",
    freigabe: "bg-emerald-100 text-emerald-800",
    abgeschlossen: "bg-green-100 text-green-800",
    archiviert: "bg-surface-200 text-gray-600",
  };
  return (
    <span className={`badge ${styles[status]}`}>
      {label}
    </span>
  );
}

function getCategoryDisplay(
  category: string | null,
  workspaceId: string,
  categoriesByWorkspace: Record<string, { name: string; prefix: string }[]> | undefined,
) {
  if (!category) return "—";
  const list = categoriesByWorkspace?.[workspaceId];
  const found = list?.find((c) => c.prefix === category);
  return found ? found.name : category;
}

function ProjectCard({
  project,
  categoriesByWorkspace,
}: {
  project: ProjectRow;
  categoriesByWorkspace?: Record<string, { name: string; prefix: string }[]>;
}) {
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;
  // Thumbnail-ID ist serverseitig vorgeladen (siehe `projects/page.tsx`)
  const thumbId = project.project_image_id;

  const updatedText = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: dateLocale,
  });

  return (
    <Link
      key={project.id}
      href={`/projects/${project.id}`}
      className="card flex items-center gap-4 p-4 transition-colors hover:bg-gray-50/80"
    >
      {/* Handy: großes Einzelbild; Desktop: etwas kleiner */}
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 md:h-28 md:w-28">
        {thumbId ? (
          <Image
            src={`/api/files/${thumbId}/preview`}
            alt=""
            width={112}
            height={112}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-gray-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 md:text-base">
          {project.product_name}
        </p>
        <p className="text-xs font-mono text-gray-500 md:text-sm">
          {project.dev_number}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 md:text-sm">
          {project.workspace_name ? (
            <span className="max-w-[12rem] truncate text-gray-600 sm:max-w-none" title={project.workspace_name}>
              <span className="text-gray-400">{t("projects.workspace")}:</span>{" "}
              <span className="font-medium text-gray-800">{project.workspace_name}</span>
            </span>
          ) : null}
          {/* Kategorie nur ab Tablet anzeigen */}
          <span className="hidden md:inline">
            {getCategoryDisplay(project.category, project.workspace_id, categoriesByWorkspace)}
          </span>
          <StatusBadge
            status={project.status}
            label={t(`status.${project.status}`)}
          />
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{updatedText}</span>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
    </Link>
  );
}

export function ProjectsList({ projects, categoriesByWorkspace }: ProjectsListProps) {
  const { lang } = useApp();
  const t = getT(lang);

  if (projects.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm font-medium text-gray-500">
          {t("projects.noProjects")}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {t("projects.noProjectsHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          categoriesByWorkspace={categoriesByWorkspace}
        />
      ))}
    </div>
  );
}
