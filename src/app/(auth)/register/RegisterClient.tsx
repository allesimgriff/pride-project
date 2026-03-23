"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPublicAppBaseUrlFromEnv } from "@/lib/appPublicUrl";
import { parseInviteTokenFromQuery } from "@/lib/inviteToken";
import { createClient as createSupabaseBrowser } from "@/lib/supabase/client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { AppEdition } from "@/lib/appEdition";

const LANG_KEY = "pride-lang";
const LAST_EMAIL_KEY = "pride-last-email";

type InviteInfo = {
  email: string;
  full_name: string | null;
  role: string;
};

export default function RegisterClient({ edition }: { edition: AppEdition }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = parseInviteTokenFromQuery(searchParams.get("token"));
  const workspaceInviteToken = parseInviteTokenFromQuery(
    searchParams.get("workspace_token"),
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(
    !!(inviteToken || workspaceInviteToken),
  );
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [workspaceInviteEmail, setWorkspaceInviteEmail] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "de") setLang(stored);
  }, []);

  useEffect(() => {
    if (!inviteToken) return;
    const token = inviteToken;

    async function loadInvite() {
      setInviteLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/invites/validate?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const payload: unknown = await res.json().catch(() => ({}));

        setInviteLoading(false);

        if (typeof payload !== "object" || payload === null || !("ok" in payload)) {
          setError(
            lang === "de"
              ? "Einladung konnte nicht geladen werden. Bitte Seite neu laden oder neuen Link anfordern."
              : "Could not load invitation. Reload the page or request a new link.",
          );
          return;
        }

        const body = payload as { ok: boolean; error?: string; detail?: string };

        if (!body.ok) {
          if (body.error === "not_found_or_used") {
            setError(
              lang === "de"
                ? "Keine offene Einladung mehr (Link schon benutzt oder unbekannt)."
                : "No open invitation (link already used or unknown).",
            );
            return;
          }
          if (body.error === "rpc_error" && process.env.NODE_ENV === "development" && body.detail) {
            setError(
              lang === "de"
                ? `Einladung konnte nicht geladen werden. (${body.detail})`
                : `Could not load invitation. (${body.detail})`,
            );
            return;
          }
          setError(
            lang === "de"
              ? "Einladung konnte nicht geladen werden. Bitte Seite neu laden oder neuen Link anfordern."
              : "Could not load invitation. Reload the page or request a new link.",
          );
          return;
        }

        const data = payload as {
          ok: true;
          email: string;
          full_name: string | null;
          role: string;
        };
        setInvite({
          email: data.email,
          full_name: data.full_name,
          role: data.role,
        });
        setEmail(data.email);
        if (data.full_name) setFullName(data.full_name);
      } catch {
        setInviteLoading(false);
        setError(
          lang === "de"
            ? "Einladung konnte nicht geladen werden (Netzwerk)."
            : "Could not load invitation (network).",
        );
      }
    }

    void loadInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  useEffect(() => {
    if (inviteToken || !workspaceInviteToken) return;
    const token = workspaceInviteToken;

    async function loadWorkspaceInvite() {
      setInviteLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/workspaces/invite-preview?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const payload: unknown = await res.json().catch(() => ({}));

        setInviteLoading(false);

        if (typeof payload !== "object" || payload === null || !("ok" in payload)) {
          setError(
            lang === "de"
              ? "Workspace-Einladung konnte nicht geladen werden. Bitte Seite neu laden oder neuen Link anfordern."
              : "Could not load workspace invitation. Reload the page or request a new link.",
          );
          return;
        }

        const body = payload as {
          ok: boolean;
          email?: string;
          error?: string;
        };

        if (!body.ok || !body.email) {
          const code = body.error ?? "";
          if (code === "server_config") {
            setError(
              lang === "de"
                ? "Registrierung mit Einladung ist auf dem Server nicht vollständig eingerichtet. In Netlify muss SUPABASE_SERVICE_ROLE_KEY gesetzt sein (Wert aus Supabase → API Keys → service_role)."
                : "Server is not configured for invite registration. Set SUPABASE_SERVICE_ROLE_KEY in Netlify.",
            );
          } else if (code === "already_used") {
            setError(
              lang === "de"
                ? "Diese Einladung wurde bereits verwendet. Bitte mit dieser E-Mail anmelden. Wenn noch kein Konto besteht, eine neue Einladung anfordern."
                : "This invitation was already used. Please sign in. If you have no account yet, request a new invitation.",
            );
          } else if (code === "not_found" || code === "missing_token") {
            setError(
              lang === "de"
                ? "Unbekannter oder ungültiger Link. Bitte den Link aus der neuesten Einladungs-E-Mail verwenden oder eine neue Einladung senden lassen."
                : "Unknown or invalid link. Use the link from the latest invitation email or request a new invitation.",
            );
          } else if (code === "db_error") {
            setError(
              lang === "de"
                ? "Datenbankfehler beim Laden der Einladung. Bitte später erneut versuchen oder Support informieren."
                : "Database error while loading the invitation. Please try again later.",
            );
          } else {
            setError(
              lang === "de"
                ? "Workspace-Einladung konnte nicht geladen werden. Bitte den Link aus der E-Mail erneut öffnen oder eine neue Einladung anfordern."
                : "Could not load workspace invitation. Open the email link again or request a new invitation.",
            );
          }
          return;
        }

        setWorkspaceInviteEmail(body.email.trim());
        setEmail(body.email.trim());
      } catch {
        setInviteLoading(false);
        setError(
          lang === "de"
            ? "Workspace-Einladung konnte nicht geladen werden (Netzwerk)."
            : "Could not load workspace invitation (network).",
        );
      }
    }

    void loadWorkspaceInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken, workspaceInviteToken]);

  const t = getT(lang);
  const brandName =
    edition === "handwerker" ? t("nav.brandHandwerker") : t("nav.brandPride");

  const invitationLocked =
    !!invite || (workspaceInviteEmail !== null && workspaceInviteEmail !== "");
  const useRegisterInviteApi =
    (invite !== null && inviteToken !== null) ||
    (workspaceInviteEmail !== null && workspaceInviteToken !== null);
  const tokenForRegister = inviteToken ?? workspaceInviteToken;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      workspaceInviteToken &&
      !inviteToken &&
      !workspaceInviteEmail
    ) {
      setError(
        lang === "de"
          ? "Workspace-Einladung fehlt oder ist ungültig. Bitte den Link aus der E-Mail erneut öffnen."
          : "Workspace invitation is missing or invalid. Please open the link from the email again.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const signupEmail =
      invite?.email ?? workspaceInviteEmail ?? email;
    let nextPath = `/login?email=${encodeURIComponent(signupEmail)}`;
    if (invite && inviteToken) {
      nextPath += `&invite_token=${encodeURIComponent(inviteToken)}`;
    }
    if (workspaceInviteEmail && workspaceInviteToken) {
      nextPath += `&workspace_token=${encodeURIComponent(workspaceInviteToken)}`;
    }
    const publicBase =
      getPublicAppBaseUrlFromEnv() ?? window.location.origin;
    const emailRedirectTo = `${publicBase}/auth/callback?next=${encodeURIComponent(
      nextPath,
    )}`;

    let errMsg: string | null = null;
    let needConfirmEmail = true;
    let invitedWorkspaceId: string | null = null;
    try {
      if (useRegisterInviteApi && tokenForRegister) {
        const regRes = await fetch("/api/auth/register-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: signupEmail,
            password,
            fullName: fullName || signupEmail,
            inviteToken: tokenForRegister,
          }),
        });
        const regPayload = (await regRes.json().catch(() => ({}))) as {
          error?: string;
          workspaceId?: string;
        };
        if (!regRes.ok) {
          errMsg = regPayload.error || "Registrierung fehlgeschlagen.";
        } else {
          invitedWorkspaceId = regPayload.workspaceId ?? null;
          needConfirmEmail = false;
        }
      } else {
        /** Sign-up im Browser (nicht /api/auth/sign-up): PKCE-Code-Verifizierer landet in Cookies derselben Sitzung — nötig für „Confirm signup“ /auth/callback. */
        const supabase = createSupabaseBrowser();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: signupEmail,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName || signupEmail,
              ...(invite ? { role: invite.role } : {}),
            },
          },
        });
        if (signUpError) {
          errMsg = signUpError.message || "Registrierung fehlgeschlagen.";
        } else {
          needConfirmEmail =
            signUpData.session == null && signUpData.user != null;
        }
      }
    } catch {
      errMsg =
        lang === "de"
          ? "Netzwerkfehler. Bitte Verbindung prüfen oder Seite neu laden."
          : "Network error. Please check your connection or reload the page.";
    }

    setLoading(false);

    if (errMsg) {
      setError(errMsg);
      return;
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_EMAIL_KEY, signupEmail);
    }

    if (useRegisterInviteApi && tokenForRegister && !needConfirmEmail) {
      try {
        const loginRes = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: signupEmail, password }),
          credentials: "same-origin",
        });
        if (loginRes.ok) {
          const target =
            edition === "handwerker"
              ? "/projects"
              : invitedWorkspaceId
                ? `/workspaces/${invitedWorkspaceId}`
                : "/projects";
          router.push(target);
          router.refresh();
          return;
        }
      } catch {
        // Falls Auto-Login fehlschlägt, trotzdem Erfolg melden und manuellen Login erlauben.
      }
    }

    setSuccess(
      needConfirmEmail
        ? lang === "de"
          ? "Registrierung erfolgreich. Bitte prüfen Sie Ihre E-Mails und bestätigen Sie den Zugang über den Link. Anschließend können Sie sich über den Login anmelden."
          : "Registration successful. Please check your email and confirm your account using the link. After that, you can log in."
        : lang === "de"
          ? "Konto ist aktiv. Sie sind eingeladen und können sofort arbeiten."
          : "Your account is active. You can start working immediately.",
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold text-gray-900">
                {invite || workspaceInviteEmail
                  ? lang === "de"
                    ? "Einladung annehmen"
                    : "Accept invitation"
                  : lang === "de"
                    ? "Mitarbeiter registrieren"
                    : "Register account"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {invite || workspaceInviteEmail
                  ? t("register.inviteIntro").replace("{{brand}}", brandName)
                  : lang === "de"
                    ? "Geben Sie Ihre Daten ein, um einen Zugang zum Projektmanagement zu erhalten."
                    : "Enter your details to get access to the project management."}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setLang("de");
                  if (typeof localStorage !== "undefined")
                    localStorage.setItem(LANG_KEY, "de");
                }}
                className={`rounded px-2 py-1 text-sm font-medium ${
                  lang === "de"
                    ? "bg-primary-100 text-primary-800"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  if (typeof localStorage !== "undefined")
                    localStorage.setItem(LANG_KEY, "en");
                }}
                className={`rounded px-2 py-1 text-sm font-medium ${
                  lang === "en"
                    ? "bg-primary-100 text-primary-800"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {inviteLoading ? (
            <p className="text-sm text-gray-500">
              {lang === "de" ? "Lade Einladung..." : "Loading invitation..."}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  className="rounded-md bg-green-50 p-3 text-sm text-green-700"
                  role="status"
                >
                  {success}
                </div>
              )}
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  {lang === "de" ? "Name" : "Name"}
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base mt-1"
                  placeholder={
                    lang === "de" ? "Vor- und Nachname" : "Full name"
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("login.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!invitationLocked}
                  className={`input-base mt-1 ${
                    invitationLocked ? "bg-gray-50 text-gray-600" : ""
                  }`}
                  placeholder={t("login.emailPlaceholder")}
                  autoComplete="email"
                  readOnly={invitationLocked}
                  disabled={invitationLocked}
                />
                {invitationLocked && (
                  <p className="mt-1 text-xs text-gray-500">
                    {lang === "de"
                      ? "Die E-Mail-Adresse stammt aus der Einladung und kann nicht geändert werden."
                      : "The email address comes from the invitation and cannot be changed."}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("login.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-base mt-1"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {lang === "de"
                    ? "Das Passwort kann später im Profil geändert werden."
                    : "You can change the password later in your profile."}
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  inviteLoading ||
                  (!!workspaceInviteToken &&
                    !inviteToken &&
                    !workspaceInviteEmail)
                }
                className="btn-primary w-full"
              >
                {loading
                  ? lang === "de"
                    ? "Registriere..."
                    : "Registering..."
                  : lang === "de"
                    ? "Registrieren"
                    : "Register"}
              </button>
            </form>
          )}

          {!invite && !workspaceInviteEmail && (
            <p className="mt-6 text-center text-sm text-gray-500">
              {lang === "de"
                ? "Sie haben bereits einen Zugang? Melden Sie sich über den Login an."
                : "Already have an account? Please use the login page."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

