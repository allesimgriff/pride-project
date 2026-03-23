"use client";

import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function ProjectsScopeHint({
  isAdmin,
  inAnyWorkspace,
}: {
  isAdmin: boolean;
  inAnyWorkspace: boolean;
}) {
  const { lang } = useApp();
  const t = getT(lang);
  if (isAdmin) {
    return <p className="text-sm text-gray-500">{t("projects.scopeHintAdmin")}</p>;
  }
  if (!inAnyWorkspace) {
    return (
      <p
        className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
        role="status"
      >
        {t("projects.scopeHintNoWorkspace")}
      </p>
    );
  }
  return <p className="text-sm text-gray-500">{t("projects.scopeHint")}</p>;
}
