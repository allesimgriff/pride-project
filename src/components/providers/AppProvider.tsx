"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Lang } from "@/lib/i18n";
import { getT } from "@/lib/i18n";

type AppContextType = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  lang: Lang;
  setLang: (v: Lang) => void;
};

const AppContext = createContext<AppContextType | null>(null);

const LANG_KEY = "pride-lang";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    const s = localStorage.getItem(LANG_KEY);
    if (s === "en" || s === "de") setLangState(s);
  }, []);

  const setLang = useCallback((v: Lang) => {
    setLangState(v);
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, v);
  }, []);

  return (
    <AppContext.Provider
      value={{ sidebarCollapsed, setSidebarCollapsed, lang, setLang }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useTranslation() {
  const { lang, setLang } = useApp();
  const t = getT(lang);
  return { t, lang, setLang };
}
