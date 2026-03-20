"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moveProjectToWorkspaceAction } from "@/app/actions/projects";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function ProjectWorkspaceMove({
  projectId,
  currentWorkspaceId,
  currentWorkspaceName,
  targets,
}: {
  projectId: string;
  currentWorkspaceId: string;
  currentWorkspaceName: string;
  targets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const others = targets.filter((w) => w.id !== currentWorkspaceId);
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);

  async function onMove() {
    if (!targetId || busy) return;
    if (!confirm(t("moveWorkspace.confirm"))) return;
    setBusy(true);
    const { error } = await moveProjectToWorkspaceAction(projectId, targetId);
    setBusy(false);
    if (error) {
      alert(error);
      return;
    }
    router.refresh();
  }

  if (others.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("moveWorkspace.title")}</h2>
        <p className="mt-2 text-sm text-gray-500">{t("moveWorkspace.none")}</p>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-medium text-gray-700">{t("moveWorkspace.current")}:</span>{" "}
          {currentWorkspaceName}
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900">{t("moveWorkspace.title")}</h2>
      <p className="mt-1 text-sm text-gray-600">
        <span className="font-medium text-gray-700">{t("moveWorkspace.current")}:</span>{" "}
        {currentWorkspaceName}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            {t("moveWorkspace.targetLabel")}
          </span>
          <select
            className="input-base w-full"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={busy}
          >
            <option value="">{t("moveWorkspace.selectPlaceholder")}</option>
            {others.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void onMove()}
          disabled={!targetId || busy}
          className="btn-primary shrink-0 disabled:opacity-50"
        >
          {busy ? t("moveWorkspace.moving") : t("moveWorkspace.button")}
        </button>
      </div>
    </div>
  );
}
