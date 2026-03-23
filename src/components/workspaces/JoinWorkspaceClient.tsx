"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function JoinWorkspaceClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const { lang, edition } = useApp();
  const t = getT(lang);
  const [busy, setBusy] = useState(false);

  const joinReturnPath =
    token !== "" ? `/workspaces/join?token=${encodeURIComponent(token)}` : "/workspaces/join";

  async function onJoin() {
    if (!token || busy) return;
    setBusy(true);
    const res = await fetch("/api/workspaces/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      workspaceId?: string | null;
      error?: string | null;
    };
    setBusy(false);
    if (!res.ok || !result.ok || !result.workspaceId) {
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
      ) : !isLoggedIn ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-800">{t("workspaces.joinNeedAuth")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/login?redirectTo=${encodeURIComponent(joinReturnPath)}`}
              className="btn-primary inline-flex justify-center text-center"
            >
              {t("workspaces.joinLogin")}
            </Link>
            <Link
              href={`/register?workspace_token=${encodeURIComponent(token)}`}
              className="btn-secondary inline-flex justify-center text-center"
            >
              {t("workspaces.joinRegister")}
            </Link>
          </div>
          <p className="text-xs text-gray-500">{t("workspaces.joinEmailMustMatch")}</p>
        </div>
      ) : (
        <button type="button" className="btn-primary mt-6" disabled={busy} onClick={onJoin}>
          {busy ? "…" : t("workspaces.joinButton")}
        </button>
      )}
    </div>
  );
}
