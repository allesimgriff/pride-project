import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseInviteTokenFromQuery } from "@/lib/inviteToken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("token");
  const token = parseInviteTokenFromQuery(raw);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "missing_or_invalid_token" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("get_invite_for_registration", {
    p_token: token,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "rpc_error",
        ...(process.env.NODE_ENV === "development" ? { detail: error.message } : {}),
      },
      { status: 502 },
    );
  }

  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || typeof row !== "object" || !("email" in row)) {
    return NextResponse.json({ ok: false, error: "not_found_or_used" }, { status: 404 });
  }

  const r = row as { email: string; full_name: string | null; role: string };
  return NextResponse.json({
    ok: true,
    email: r.email,
    full_name: r.full_name,
    role: r.role,
  });
}

