"use client";

/**
 * Wird bei Fehlern im Root-Layout aktiv – eigenes html/body nötig (Next.js App Router).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8f9fa",
          padding: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            padding: "2rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", margin: 0 }}>
            Kritischer Fehler
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#4b5563" }}>
            {process.env.NODE_ENV === "development" ? error.message : "Bitte Seite neu laden."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
              background: "#2d7a96",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
