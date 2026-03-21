"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function BackToWorkspaceLink({ workspaceId }: { workspaceId: string }) {
  const { lang } = useApp();
  const t = getT(lang);
  return (
    <Link href={`/workspaces/${workspaceId}`} className="text-sm text-primary-600 hover:text-primary-800">
      ← {t("workspaces.backToWorkspace")}
    </Link>
  );
}
