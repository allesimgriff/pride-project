"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const LANG_KEY = "pride-lang";

type InviteInfo = {
  email: string;
  full_name: string | null;
  role: string;
};

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(!!inviteToken);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "de") setLang(stored);
  }, []);

  useEffect(() => {
    if (!inviteToken) return;

    async function loadInvite() {
      setInviteLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invites")
        .select("email, full_name, role")
        .eq("token", inviteToken)
        .maybeSingle();

      setInviteLoading(false);

      if (error) {
        setError(
          lang === "de"
            ? "Einladung konnte nicht geladen werden."
            : "Could not load invitation.",
        );
        return;
      }

      if (!data) {
        setError(
          lang === "de"
            ? "Diese Einladung ist ungültig oder wurde bereits verwendet."
            : "This invitation is invalid or has already been used.",
        );
        return;
      }

      setInvite({
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      });
      setEmail(data.email);
      if (data.full_name) setFullName(data.full_name);
    }

    void loadInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  const t = getT(lang);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    const signupEmail = invite ? invite.email : email;

    const { error: err } = await supabase.auth.signUp({
      email: signupEmail,
      password,
      options: {
        data: {
          full_name: fullName || signupEmail,
          // Wenn Einladung vorhanden ist, Rolle aus Invite übernehmen,
          // sonst greift der Trigger (Standard: "entwicklung")
          ...(invite ? { role: invite.role } : {}),
        },
      },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setSuccess(
      lang === "de"
        ? "Registrierung erfolgreich. Bitte prüfen Sie Ihre E-Mails und bestätigen Sie den Zugang über den Link. Anschließend können Sie sich über den Login anmelden."
        : "Registration successful. Please check your email and confirm your account using the link. After that, you can log in.",
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold text-gray-900">
                {invite
                  ? lang === "de"
                    ? "Einladung annehmen"
                    : "Accept invitation"
                  : lang === "de"
                    ? "Mitarbeiter registrieren"
                    : "Register account"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {invite
                  ? lang === "de"
                    ? "Sie wurden eingeladen, PRIDE zu nutzen. Bitte vervollständigen Sie Ihre Daten."
                    : "You have been invited to use PRIDE. Please complete your details."
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
                  required={!invite}
                  className={`input-base mt-1 ${
                    invite ? "bg-gray-50 text-gray-600" : ""
                  }`}
                  placeholder={t("login.emailPlaceholder")}
                  autoComplete="email"
                  readOnly={!!invite}
                  disabled={!!invite}
                />
                {invite && (
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
                disabled={loading || inviteLoading}
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

          {!invite && (
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

