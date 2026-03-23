import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    "";
  return url.startsWith("https://") ? url : null;
}

/** Lädt nur die E-Mail einer offenen Workspace-Einladung (Service Role), für die Registrierungsseite. */
export async function GET(request: Request) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "server_config" },
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

  const { data, error } = await admin
    .from("workspace_invites")
    .select("email")
    .eq("token", token)
    .is("accepted_at", null)
    .maybeSingle();

  if (error || !data?.email) {
    return NextResponse.json(
      { ok: false, error: "not_found_or_used" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: (data.email as string).trim(),
  });
}
