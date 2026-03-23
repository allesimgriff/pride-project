import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseHttpsApiUrlForServer,
  getSupabaseServiceRoleKeyForServer,
} from "@/lib/supabase/public-env";

type RegisterInviteBody = {
  email?: string;
  password?: string;
  fullName?: string | null;
  inviteToken?: string;
};

export async function POST(request: Request) {
  const supabaseUrl = getSupabaseHttpsApiUrlForServer();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    "";
  const serviceRoleKey = getSupabaseServiceRoleKeyForServer();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: "Server-Konfiguration für Einladung fehlt.",
        code:
          !supabaseUrl
            ? "missing_supabase_url"
            : !anonKey
              ? "missing_anon_key"
              : "missing_service_role",
      },
      { status: 500 },
    );
  }

  let body: RegisterInviteBody;
  try {
    body = (await request.json()) as RegisterInviteBody;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = (body.fullName ?? "").trim();
  const inviteToken = (body.inviteToken ?? "").trim();

  if (!email || !password || !inviteToken) {
    return NextResponse.json(
      { error: "E-Mail, Passwort und Einladungstoken sind erforderlich." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Das Passwort muss mindestens 8 Zeichen haben." },
      { status: 400 },
    );
  }

  const anon = createSupabaseClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- 1) Workspace-Einladung zuerst (typischer PRIDE-Fall; kein Staff-RPC nötig) ---
  const { data: invRow, error: invRowErr } = await admin
    .from("workspace_invites")
    .select("id, email, workspace_id, role, accepted_at")
    .eq("token", inviteToken)
    .maybeSingle();

  if (invRowErr) {
    return NextResponse.json(
      { error: "Einladung konnte nicht geprüft werden." },
      { status: 500 },
    );
  }

  if (invRow) {
    if (invRow.accepted_at != null) {
      return NextResponse.json(
        { error: "Einladung ungültig oder bereits verwendet." },
        { status: 400 },
      );
    }

    const wsEmail = (invRow.email ?? "").trim().toLowerCase();
    if (!wsEmail || wsEmail !== email) {
      return NextResponse.json(
        { error: "E-Mail passt nicht zur Einladung." },
        { status: 400 },
      );
    }

    if (!invRow.workspace_id || !invRow.role) {
      return NextResponse.json(
        { error: "Einladung ungültig oder bereits verwendet." },
        { status: 400 },
      );
    }

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || email },
    });

    if (created.error || !created.data.user) {
      const msg = created.error?.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("exists")) {
        return NextResponse.json(
          {
            error:
              "Für diese E-Mail existiert bereits ein Konto. Bitte anmelden und den Einladungslink erneut öffnen.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: created.error?.message || "Konto konnte nicht erstellt werden." },
        { status: 400 },
      );
    }

    const userId = created.data.user.id;

    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName || email,
        role: "entwicklung",
      },
      { onConflict: "id" },
    );

    const { error: memberErr } = await admin.from("workspace_members").upsert(
      {
        workspace_id: invRow.workspace_id as string,
        user_id: userId,
        role: invRow.role as "admin" | "member",
      },
      { onConflict: "workspace_id,user_id" },
    );

    if (memberErr) {
      return NextResponse.json(
        { error: memberErr.message || "Workspace-Zuordnung fehlgeschlagen." },
        { status: 400 },
      );
    }

    await admin
      .from("workspace_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invRow.id as string);

    return NextResponse.json({
      ok: true,
      workspaceId: invRow.workspace_id as string,
    });
  }

  // --- 2) Mitarbeiter-Einladung (public.invites) ---
  const { data: staffRows, error: staffRpcErr } = await anon.rpc(
    "get_invite_for_registration",
    { p_token: inviteToken },
  );

  if (staffRpcErr) {
    return NextResponse.json(
      { error: "Einladung konnte nicht geprüft werden." },
      { status: 500 },
    );
  }

  if (!Array.isArray(staffRows) || staffRows.length === 0) {
    return NextResponse.json(
      { error: "Einladung ungültig oder bereits verwendet." },
      { status: 400 },
    );
  }

  const inviteInfo = staffRows[0] as {
    email?: string;
    full_name?: string | null;
    role?: string;
  };
  const inviteEmail = (inviteInfo.email ?? "").trim().toLowerCase();
  if (!inviteEmail || inviteEmail !== email) {
    return NextResponse.json(
      { error: "E-Mail passt nicht zur Einladung." },
      { status: 400 },
    );
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || inviteInfo.full_name || email },
  });

  if (created.error || !created.data.user) {
    const msg = created.error?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("exists")) {
      return NextResponse.json(
        {
          error:
            "Für diese E-Mail existiert bereits ein Konto. Bitte anmelden und den Einladungslink erneut öffnen.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: created.error?.message || "Konto konnte nicht erstellt werden." },
      { status: 400 },
    );
  }

  const userId = created.data.user.id;
  const profileRole = (inviteInfo.role ?? "entwicklung").trim() || "entwicklung";

  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName || inviteInfo.full_name || email,
      role: profileRole,
    },
    { onConflict: "id" },
  );

  const { error: markErr } = await admin.rpc("mark_invite_accepted", {
    p_token: inviteToken,
    p_email: email,
  });

  if (markErr) {
    return NextResponse.json(
      { error: "Konto erstellt, Einladung konnte nicht abgeschlossen werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
