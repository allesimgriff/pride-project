import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseHttpsApiUrlForServer,
  getSupabaseServiceRoleKeyForServer,
} from "@/lib/supabase/public-env";

/** Lädt nur die E-Mail einer offenen Workspace-Einladung (Service Role), für die Registrierungsseite. */
export async function GET(request: Request) {
  const supabaseUrl = getSupabaseHttpsApiUrlForServer();
  const serviceRoleKey = getSupabaseServiceRoleKeyForServer();

  if (!supabaseUrl) {
    return NextResponse.json(
      { ok: false, error: "missing_supabase_url" },
      { status: 500 },
    );
  }
  if (!serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "missing_service_role" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: row, error: qErr } = await admin
    .from("workspace_invites")
    .select("email, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (qErr) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  if (row.accepted_at != null) {
    return NextResponse.json(
      { ok: false, error: "already_used" },
      { status: 410 },
    );
  }

  const em = (row.email as string)?.trim();
  if (!em) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: em,
  });
}
