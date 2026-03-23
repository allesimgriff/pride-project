"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function ProjectsPageHeader({ canCreateProject = false }: { canCreateProject?: boolean }) {
  const { lang, edition } = useApp();
  const t = getT(lang);
  const brand =
    edition === "handwerker" ? t("nav.brandHandwerker") : t("nav.brandPride");
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-primary-600">{brand}</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          {t("projects.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("projects.subtitle")}</p>
      </div>
      {canCreateProject ? (
        <Link
          href="/projects/new"
          className="btn-primary inline-flex shrink-0 items-center justify-center"
        >
          {t("projects.newProject")}
        </Link>
      ) : null}
    </div>
  );
}
