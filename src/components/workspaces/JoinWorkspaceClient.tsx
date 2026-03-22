"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptWorkspaceInviteAction } from "@/app/actions/workspaces";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function JoinWorkspaceClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const { lang, edition } = useApp();
  const t = getT(lang);
  const [busy, setBusy] = useState(false);

  async function onJoin() {
    if (!token || busy) return;
    setBusy(true);
    const result = await acceptWorkspaceInviteAction(token);
    setBusy(false);
    if (!result.ok || !result.workspaceId) {
      alert(result.error || t("workspaces.joinError"));
      return;
    }
    alert(t("workspaces.joinSuccess"));
    router.push(edition === "handwerker" ? "/projects" : `/workspaces/${result.workspaceId}`);
    router.refresh();
  }

  return (
    <div className="card mx-auto max-w-lg p-6">
      <p className="text-sm text-gray-600">{t("workspaces.joinDescription")}</p>
      {!token ? (
        <p className="mt-4 text-sm text-amber-800">{t("workspaces.joinInvalid")}</p>
      ) : (
        <button type="button" className="btn-primary mt-6" disabled={busy} onClick={onJoin}>
          {busy ? "…" : t("workspaces.joinButton")}
        </button>
      )}
    </div>
  );
}
