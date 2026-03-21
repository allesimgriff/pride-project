"use client";

import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

/** Skeleton + Spinner + Text – unter dem Header, für Mobile mit ausreichender Höhe. */
export function DashboardPageLoading() {
  const { lang } = useApp();
  const t = getT(lang);

  return (
    <div
      className="flex min-h-[min(100dvh,56rem)] flex-col"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex shrink-0 items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/80 px-4 py-3 text-primary-800">
        <span
          className="inline-block h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 motion-reduce:animate-none motion-reduce:border-primary-400"
          aria-hidden
        />
        <span className="text-sm font-medium">{t("ui.pageLoading")}</span>
      </div>

      <div className="mt-6 flex-1 space-y-6 motion-safe:animate-pulse">
        <div className="h-9 w-48 max-w-[85vw] rounded-md bg-gray-200" />
        <div className="h-4 max-w-xl rounded bg-gray-100" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card h-24 bg-gray-100" />
          <div className="card h-24 bg-gray-100" />
          <div className="card h-24 bg-gray-100" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card min-h-[12rem] bg-gray-50 lg:min-h-[18rem]" />
          <div className="card min-h-[12rem] bg-gray-50 lg:min-h-[18rem]" />
          <div className="card min-h-[12rem] bg-gray-50 lg:min-h-[18rem]" />
        </div>
      </div>
    </div>
  );
}
