"use client";

import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface PageTitleProps {
  titleKey: string;
  subtitleKey?: string;
  /** z. B. `hidden md:block` für kompaktes Mobil-Layout */
  subtitleClassName?: string;
}

export function PageTitle({ titleKey, subtitleKey, subtitleClassName }: PageTitleProps) {
  const { lang } = useApp();
  const t = getT(lang);
  const subCls = subtitleClassName ?? "mt-1 text-sm text-gray-500";
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{t(titleKey)}</h1>
      {subtitleKey && (
        <p className={subCls}>{t(subtitleKey)}</p>
      )}
    </div>
  );
}
