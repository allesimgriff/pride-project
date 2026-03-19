"use client";

import { useRouter } from "next/navigation";
import type { ProjectStatus } from "@/types/database";
import type { Project } from "@/types/database";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface ProjectDetailHeaderProps {
  project: Project;
}

const statusStyles: Record<ProjectStatus, string> = {
  idee: "bg-gray-100 text-gray-700",
  konzept: "bg-blue-100 text-blue-800",
  entwicklung: "bg-amber-100 text-amber-800",
  muster: "bg-violet-100 text-violet-800",
  freigabe: "bg-emerald-100 text-emerald-800",
  abgeschlossen: "bg-green-100 text-green-800",
  archiviert: "bg-surface-200 text-gray-600",
};

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);

  async function handleDelete() {
    if (!confirm(lang === "de" ? "Projekt wirklich löschen?" : "Really delete this project?")) return;
    const supabase = createClient();

    // Nutzer & Rolle prüfen (nur Admin darf löschen)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(lang === "de" ? "Nicht angemeldet." : "Not signed in.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      alert(lang === "de" ? "Nur Admins dürfen Projekte löschen." : "Only admins may delete projects.");
      return;
    }

    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      alert(error.message);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {project.dev_number}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {project.product_name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {lang === "de" ? "Drucken" : "Print"}
          </button>
          <span
            className={`badge ${statusStyles[project.status]} px-3 py-1 text-sm`}
          >
            {t(`status.${project.status}`)}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            className="no-print rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            {lang === "de" ? "Projekt löschen" : "Delete project"}
          </button>
        </div>
      </div>
    </div>
  );
}
