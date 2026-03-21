import { getT } from "@/lib/i18n";

export default function AuthLoading() {
  const t = getT("de");

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-surface-100 px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 motion-reduce:animate-none"
        aria-hidden
      />
      <p className="text-center text-sm font-medium text-gray-700">{t("ui.pageLoading")}</p>
    </div>
  );
}
