"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-lg font-semibold text-gray-900">Etwas ist schiefgelaufen</h1>
        <p className="mt-2 text-sm text-gray-600">
          {process.env.NODE_ENV === "development" ? error.message : "Bitte Seite neu laden oder später erneut versuchen."}
        </p>
        <button type="button" className="btn-primary mt-6" onClick={() => reset()}>
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
