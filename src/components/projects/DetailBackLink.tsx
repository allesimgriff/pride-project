"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function DetailBackLink() {
  const { lang } = useApp();
  const t = getT(lang);
  return (
    <Link
      href="/projects"
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("detail.backToList")}
    </Link>
  );
}
