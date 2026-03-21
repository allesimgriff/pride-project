"use client";

import type { ProjectLabelKey } from "@/lib/projectLabelDefaults";
import { PROJECT_LABEL_SORT_ORDER } from "@/lib/projectLabelDefaults";

/** Kleine Nr. wie in Workspace/Einstellungen → Überschriften (sort_order). */
export function ProjectLabelNrBadge({
  labelKey,
  title,
}: {
  labelKey: ProjectLabelKey;
  /** z. B. erklärender Tooltip */
  title?: string;
}) {
  const n = PROJECT_LABEL_SORT_ORDER[labelKey];
  return (
    <span
      className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 px-1 text-xs font-semibold tabular-nums text-gray-600"
      title={title}
    >
      {n}
    </span>
  );
}
