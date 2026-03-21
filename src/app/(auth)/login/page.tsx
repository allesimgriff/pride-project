"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const LANG_KEY = "pride-lang";
const LAST_EMAIL_KEY = "pride-last-email";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/projects";
  const prefillEmail = searchParams.get("email") ?? "";

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "de") setLang(stored);
  }, []);

  useEffect(() => {
    if (prefillEmail && !email) {
      setEmail(prefillEmail);
      return;
    }
    if (!email && typeof localStorage !== "undefined") {
      const last = localStorage.getItem(LAST_EMAIL_KEY) ?? "";
      if (last) setEmail(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEmail]);

  const t = getT(lang);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
      });
      const data: unknown = await res.json().catch(() => ({}));
      const msg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : null;
      if (!res.ok) {
        setError(msg ?? "Anmeldung fehlgeschlagen.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(
        "Netzwerkfehler. Bitte Verbindung prüfen oder Seite neu laden.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("login.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("login.subtitle")}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => { setLang("de"); if (typeof localStorage !== "undefined") localStorage.setItem(LANG_KEY, "de"); }}
                className={`rounded px-2 py-1 text-sm font-medium ${lang === "de" ? "bg-primary-100 text-primary-800" : "text-gray-500 hover:bg-gray-100"}`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => { setLang("en"); if (typeof localStorage !== "undefined") localStorage.setItem(LANG_KEY, "en"); }}
                className={`rounded px-2 py-1 text-sm font-medium ${lang === "en" ? "bg-primary-100 text-primary-800" : "text-gray-500 hover:bg-gray-100"}`}
              >
                EN
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-base mt-1"
                placeholder={t("login.emailPlaceholder")}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t("login.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-base mt-1"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            {t("login.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
