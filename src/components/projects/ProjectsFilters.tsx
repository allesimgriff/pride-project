"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { STATUS_LABELS } from "@/types/database";
import type { ProjectStatus } from "@/types/database";

const STATUSES: ProjectStatus[] = [
  "idee",
  "konzept",
  "entwicklung",
  "muster",
  "freigabe",
  "abgeschlossen",
  "archiviert",
];

interface ProjectsFiltersProps {
  categories: { name: string; prefix: string }[];
  currentStatus?: string;
  currentCategory?: string;
  currentSearch?: string;
  currentHasProjectImage?: boolean;
}

export function ProjectsFilters({
  categories,
  currentStatus,
  currentCategory,
  currentSearch,
  currentHasProjectImage,
}: ProjectsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useApp();
  const t = getT(lang);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/projects?${next.toString()}`);
    },
    [router, searchParams]
  );

  const hasFilters =
    currentStatus || currentCategory || currentSearch || currentHasProjectImage;

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            {t("projects.search")}
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="search"
              type="search"
              defaultValue={currentSearch}
              placeholder={t("projects.searchPlaceholder")}
              className="input-base pl-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setParam("q", (e.target as HTMLInputElement).value || null);
                }
              }}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("projects.status")}</label>
            <select
              value={currentStatus ?? ""}
              onChange={(e) => setParam("status", e.target.value || null)}
              className="input-base mt-1"
            >
              <option value="">{t("projects.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("projects.category")}</label>
            <select
              value={currentCategory ?? ""}
              onChange={(e) => setParam("category", e.target.value || null)}
              className="input-base mt-1"
            >
              <option value="">{t("projects.all")}</option>
              {categories.map((c) => (
                <option key={c.prefix} value={c.prefix}>
                  {c.name} ({c.prefix})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-gray-700 sm:pb-0">
              <input
                type="checkbox"
                checked={!!currentHasProjectImage}
                onChange={(e) => setParam("hasProjectImage", e.target.checked ? "1" : null)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              {t("projects.hasProjectImage")}
            </label>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="btn-secondary flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {t("projects.resetFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
