"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Lang } from "@/lib/i18n";
import { getT } from "@/lib/i18n";
import type { AppEdition } from "@/lib/appEdition";

type AppContextType = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  lang: Lang;
  setLang: (v: Lang) => void;
  /** Build-Zeit: pride = volle UI, handwerker = reduziert */
  edition: AppEdition;
};

const AppContext = createContext<AppContextType | null>(null);

const LANG_KEY = "pride-lang";

export function AppProvider({
  children,
  edition,
}: {
  children: React.ReactNode;
  edition: AppEdition;
}) {
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
      value={{ sidebarCollapsed, setSidebarCollapsed, lang, setLang, edition }}
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
