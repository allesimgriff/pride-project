"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { ProjectStatus } from "@/types/database";
import { ArrowRight, FileText, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProjectRow {
  id: string;
  dev_number: string;
  product_name: string;
  category: string | null;
  status: ProjectStatus;
  updated_at: string;
  project_image_id: string | null;
}

interface ProjectsListProps {
  projects: ProjectRow[];
  categoryNames?: { name: string; prefix: string }[];
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

function getCategoryDisplay(category: string | null, categoryNames: { name: string; prefix: string }[] | undefined) {
  if (!category) return "—";
  const found = categoryNames?.find((c) => c.prefix === category);
  return found ? `${found.name} (${found.prefix})` : category;
}

function ProjectCard({
  project,
  categoryNames,
}: {
  project: ProjectRow;
  categoryNames?: { name: string; prefix: string }[];
}) {
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;
  const [thumbIds, setThumbIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadThumbs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("project_files")
        .select("id")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true })
        .limit(5);
      if (!cancelled && data) {
        setThumbIds(data.map((f) => f.id));
      }
    }
    loadThumbs();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const updatedText = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: dateLocale,
  });

  return (
    <Link
      key={project.id}
      href={`/projects/${project.id}`}
      className="card flex items-center gap-5 p-4 transition-colors hover:bg-gray-50/80"
    >
      {/* bis zu 5 Bilder nebeneinander (1 gesetztes Projektbild + bis zu 4 weitere) */}
      <div className="flex h-24 w-56 shrink-0 items-center gap-1 overflow-hidden">
        {thumbIds.length === 0 ? (
          <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
            <ImageIcon className="h-8 w-8" />
          </div>
        ) : (
          thumbIds.slice(0, 5).map((id) => (
            <div
              key={id}
              className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              <Image
                src={`/api/files/${id}/preview`}
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
                unoptimized
              />
            </div>
          ))
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{project.product_name}</p>
        <p className="text-sm font-mono text-gray-500">{project.dev_number}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <span>{getCategoryDisplay(project.category, categoryNames)}</span>
          <span className="text-gray-400">·</span>
          <StatusBadge status={project.status} label={t(`status.${project.status}`)} />
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{updatedText}</span>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
    </Link>
  );
}

export function ProjectsList({ projects, categoryNames }: ProjectsListProps) {
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
          categoryNames={categoryNames}
        />
      ))}
    </div>
  );
}
