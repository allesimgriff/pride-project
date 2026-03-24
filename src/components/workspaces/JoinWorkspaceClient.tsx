"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { parseInviteTokenFromQuery } from "@/lib/inviteToken";

export function JoinWorkspaceClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = (() => {
    const direct =
      parseInviteTokenFromQuery(params.get("token")) ??
      parseInviteTokenFromQuery(params.get("workspace_token"));
    if (direct) return direct;
    // Fallback für Security-/Safe-Link-Wrapper: Token kann in anderen Query-Werten stecken.
    for (const [, value] of params.entries()) {
      const parsed = parseInviteTokenFromQuery(value);
      if (parsed) return parsed;
    }
    return "";
  })();
  const { lang, setLang } = useApp();
  const t = getT(lang);
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteLoading, setInviteLoading] = useState<boolean>(!!token);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const joinReturnPath =
    token !== "" ? `/workspaces/join?token=${encodeURIComponent(token)}` : "/workspaces/join";

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`/api/workspaces/invite-preview?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          email?: string;
          error?: string;
        };
        if (res.ok && body.ok && body.email) {
          setInviteEmail(body.email.trim());
        } else {
          const code = body.error ?? "";
          setError(
            code === "already_used"
              ? t("workspaces.joinAlreadyUsed")
              : code === "missing_service_role"
                ? t("workspaces.joinConfigMissingServiceRole")
                : code === "missing_supabase_url"
                  ? t("workspaces.joinConfigMissingSupabaseUrl")
                  : code === "db_error"
                    ? t("workspaces.joinDbError")
                    : t("workspaces.joinInvalid"),
          );
        }
      } catch {
        setError(t("workspaces.joinError"));
      } finally {
        setInviteLoading(false);
      }
    })();
  }, [isLoggedIn, token, lang, t]);

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
    router.push("/projects");
    router.refresh();
  }

  async function onActivateAndJoin() {
    if (!token || busy || !inviteEmail) return;
    if (password.length < 8) {
      setError(t("workspaces.joinPasswordMin"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("workspaces.joinPasswordMismatch"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const regRes = await fetch("/api/auth/register-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          password,
          fullName: inviteEmail,
          inviteToken: token,
        }),
      });
      const regBody = (await regRes.json().catch(() => ({}))) as {
        ok?: boolean;
        workspaceId?: string;
        error?: string;
        code?: string;
      };

      const needsLoginJoin =
        !regRes.ok &&
        (regBody.code === "account_exists_login_required" || regBody.code === "already_used");

      if (!regRes.ok && !needsLoginJoin) {
        setError(regBody.error || t("workspaces.joinError"));
        setBusy(false);
        return;
      }

      const loginRes = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, password }),
        credentials: "same-origin",
      });
      const loginBody = (await loginRes.json().catch(() => ({}))) as { error?: string };
      if (!loginRes.ok) {
        setError(loginBody.error || t("workspaces.joinLoginFailed"));
        setBusy(false);
        return;
      }

      let workspaceId = regBody.workspaceId ?? null;
      if (!workspaceId) {
        const joinRes = await fetch("/api/workspaces/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const joinBody = (await joinRes.json().catch(() => ({}))) as {
          ok?: boolean;
          workspaceId?: string | null;
          error?: string | null;
        };
        if (!joinRes.ok || !joinBody.ok || !joinBody.workspaceId) {
          setError(joinBody.error || t("workspaces.joinError"));
          setBusy(false);
          return;
        }
        workspaceId = joinBody.workspaceId;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError(t("workspaces.joinError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mx-auto max-w-lg p-6">
      <div className="mb-3 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => setLang("de")}
          className={`rounded px-2 py-1 text-sm font-medium ${
            lang === "de" ? "bg-primary-100 text-primary-800" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          DE
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`rounded px-2 py-1 text-sm font-medium ${
            lang === "en" ? "bg-primary-100 text-primary-800" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          EN
        </button>
      </div>
      <p className="text-sm text-gray-600">{t("workspaces.joinDescription")}</p>
      {!token ? (
        <p className="mt-4 text-sm text-amber-800">{t("workspaces.joinInvalid")}</p>
      ) : !isLoggedIn ? (
        <div className="mt-6 space-y-4">
          {inviteLoading ? (
            <p className="text-sm text-gray-500">{t("workspaces.joinLoading")}</p>
          ) : (
            <>
              {error ? (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              ) : null}
              <p className="text-xs text-gray-600">{t("workspaces.joinFormHint")}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("workspaces.joinFormEmail")}</label>
                <input
                  type="email"
                  className="input-base mt-1 bg-gray-50 text-gray-600"
                  value={inviteEmail}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("workspaces.joinFormPassword")}</label>
                <input
                  type="password"
                  className="input-base mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("workspaces.joinFormPasswordConfirm")}</label>
                <input
                  type="password"
                  className="input-base mt-1"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="button"
                className="btn-primary inline-flex justify-center text-center"
                disabled={busy || !inviteEmail}
                onClick={onActivateAndJoin}
              >
                {busy ? t("workspaces.joinFormSubmitting") : t("workspaces.joinFormSubmit")}
              </button>
              <p className="text-xs text-gray-500">
                <Link href={`/login?redirectTo=${encodeURIComponent(joinReturnPath)}`} className="underline">
                  {t("workspaces.joinLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {inviteLoading ? (
            <p className="text-sm text-gray-500">{t("workspaces.joinLoading")}</p>
          ) : (
            <>
              {error ? (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("workspaces.joinFormEmail")}</label>
                <input
                  type="email"
                  className="input-base mt-1 bg-gray-50 text-gray-600"
                  value={inviteEmail || "—"}
                  readOnly
                  disabled
                />
              </div>
              <button type="button" className="btn-primary" disabled={busy || !token} onClick={onJoin}>
                {busy ? t("workspaces.joinButtonBusy") : t("workspaces.joinButton")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
