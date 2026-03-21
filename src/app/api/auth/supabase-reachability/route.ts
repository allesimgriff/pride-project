import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/public-env";
import { describeFetchError } from "@/lib/supabase/network-error";

/**
 * Nur Entwicklung: prüft, ob dieser PC aus Node heraus Supabase erreicht.
 * Im Browser öffnen: http://localhost:3000/api/auth/supabase-reachability
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        hint: ".env.local: NEXT_PUBLIC_SUPABASE_URL und öffentlicher Key fehlen (ANON oder PUBLISHABLE_DEFAULT).",
      },
      { status: 500 },
    );
  }

  const healthUrl = `${cfg.url.replace(/\/$/, "")}/auth/v1/health`;

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
    });
    const text = await res.text().catch(() => "");
    return NextResponse.json({
      ok: res.ok,
      httpStatus: res.status,
      healthUrl: healthUrl.split("?")[0],
      bodyPreview: text.slice(0, 200),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        step: "fetch",
        message: describeFetchError(e),
        healthUrl: healthUrl.split("?")[0],
        hints: [
          "Internet / DNS prüfen (im Browser dieselbe healthUrl testen).",
          "VPN kurz aus, andere Firewall/„Sicherheits“-Software testen.",
          "Supabase-Dashboard: Projekt nicht pausiert?",
          "Windows: falsche Systemzeit kann TLS brechen.",
        ],
      },
      { status: 503 },
    );
  }
}
