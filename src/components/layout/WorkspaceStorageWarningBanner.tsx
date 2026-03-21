"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { WorkspaceStorageWarning } from "@/lib/workspaceStorageQuota";
import { formatBytes } from "@/lib/formatBytes";

export function WorkspaceStorageWarningBanner({ warnings }: { warnings: WorkspaceStorageWarning[] }) {
  const { lang } = useApp();
  const t = getT(lang);
  const locale = lang === "de" ? "de-DE" : "en-US";

  if (warnings.length === 0) return null;

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-6"
      role="status"
    >
      <p className="font-medium text-amber-900">{t("storage.warningIntro")}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/95">
        {warnings.map((w) => (
          <li key={w.workspaceId}>
            {t("storage.warningLine")
              .replace("{{name}}", w.workspaceName)
              .replace("{{percent}}", String(Math.round(w.percentUsed)))
              .replace("{{used}}", formatBytes(w.usedBytes, locale))
              .replace("{{limit}}", formatBytes(w.limitBytes, locale))}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-amber-800/95">
        <Link href="/workspaces" className="font-medium underline hover:text-amber-950">
          {t("storage.workspacesLink")}
        </Link>
      </p>
    </div>
  );
}
