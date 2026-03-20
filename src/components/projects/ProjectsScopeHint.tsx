"use client";

import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function ProjectsScopeHint() {
  const { lang } = useApp();
  const t = getT(lang);
  return <p className="text-sm text-gray-500">{t("projects.scopeHint")}</p>;
}
