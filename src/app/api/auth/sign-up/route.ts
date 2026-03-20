import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { describeFetchError } from "@/lib/supabase/network-error";

/**
 * Registrierung über den Server (analog zu /api/auth/sign-in).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  if (!o) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = typeof o.email === "string" ? o.email.trim() : "";
  const password = typeof o.password === "string" ? o.password : "";
  const emailRedirectTo =
    typeof o.emailRedirectTo === "string" ? o.emailRedirectTo.trim() : "";
  const full_name = typeof o.full_name === "string" ? o.full_name.trim() : "";
  const role = typeof o.role === "string" ? o.role.trim() : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort erforderlich." },
      { status: 400 },
    );
  }

  if (!emailRedirectTo) {
    return NextResponse.json(
      { error: "Redirect-URL fehlt." },
      { status: 400 },
    );
  }

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(emailRedirectTo);
  } catch {
    return NextResponse.json(
      { error: "Ungültige Redirect-URL." },
      { status: 400 },
    );
  }
  if (redirectUrl.protocol !== "http:" && redirectUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "Ungültige Redirect-URL." },
      { status: 400 },
    );
  }

  const origin = request.headers.get("origin");
  if (!origin || !emailRedirectTo.startsWith(`${origin}/`)) {
    return NextResponse.json(
      { error: "Redirect-URL passt nicht zur Anfrage." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: full_name || email,
          ...(role ? { role } : {}),
        },
      },
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
        { error: error.message || "Registrierung fehlgeschlagen." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[sign-up]", describeFetchError(e));
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
