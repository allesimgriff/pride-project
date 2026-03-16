"use client";

import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const LANG_KEY = "pride-lang";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "de") setLang(stored);
  }, []);

  const t = getT(lang);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
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
