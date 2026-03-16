"use client";

import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface PageTitleProps {
  titleKey: string;
  subtitleKey?: string;
}

export function PageTitle({ titleKey, subtitleKey }: PageTitleProps) {
  const { lang } = useApp();
  const t = getT(lang);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{t(titleKey)}</h1>
      {subtitleKey && (
        <p className="mt-1 text-sm text-gray-500">{t(subtitleKey)}</p>
      )}
    </div>
  );
}
