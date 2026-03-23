import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { describeFetchError } from "@/lib/supabase/network-error";

/** Supabase nennt falsche Zugangsdaten nicht getrennt (Sicherheit). */
function mapSignInErrorToUserMessage(message: string): string {
  const m = (message || "").trim().toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch. Bitte erneut prüfen.";
  }
  if (m.includes("email not confirmed")) {
    return "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse (Link in der Registrierungs-Mail).";
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "Zu viele Versuche. Bitte kurz warten und erneut versuchen.";
  }
  return message.trim() || "Anmeldung fehlgeschlagen.";
}

/**
 * Login über den Server: Der Browser ruft nur /api/auth/sign-in auf.
 * Hilft, wenn direkte Requests zu *.supabase.co im Browser blockiert werden („Failed to fetch“).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";
  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort erforderlich." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const looksNetwork =
        msg.includes("fetch failed") ||
        msg.includes("failed to fetch") ||
        msg.includes("network") ||
        msg.includes("econnrefused") ||
        msg.includes("enotfound");

      if (looksNetwork) {
        return NextResponse.json(
          {
            error:
              "Keine Verbindung zu Supabase (Netzwerk/TLS/Firewall). Nur Entwicklung: /api/auth/supabase-reachability im Browser öffnen.",
            code: "SUPABASE_UNREACHABLE",
            ...(process.env.NODE_ENV === "development"
              ? { detail: error.message }
              : {}),
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: mapSignInErrorToUserMessage(error.message) },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[sign-in]", describeFetchError(e));
    return NextResponse.json(
      {
        error:
          "Keine Verbindung zu Supabase (Netzwerk/TLS/Firewall). Nur Entwicklung: /api/auth/supabase-reachability im Browser öffnen.",
        code: "SUPABASE_UNREACHABLE",
        ...(process.env.NODE_ENV === "development"
          ? { detail: describeFetchError(e) }
          : {}),
      },
      { status: 503 },
    );
  }
}
