import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-100 px-6">
      <p className="text-sm font-medium text-primary-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-gray-900">Seite nicht gefunden</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gray-600">
        Diese Adresse gibt es hier nicht. Prüfen Sie die URL oder kehren Sie zum Dashboard zurück.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary inline-flex">
          Zum Dashboard
        </Link>
        <Link href="/projects" className="btn-secondary inline-flex">
          Projekte
        </Link>
        <Link href="/login" className="btn-secondary inline-flex">
          Anmelden
        </Link>
      </div>
    </div>
  );
}
