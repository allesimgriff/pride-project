import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { isAppAdmin, isWorkspaceAdmin } from "@/lib/workspacePermissions";
import { resolveMailAppBaseUrl, sendWorkspaceInviteEmail } from "@/lib/mail";
import type { WorkspaceMemberRole } from "@/types/database";

type Body = {
  workspaceId?: string;
  email?: string;
  inviteRole?: WorkspaceMemberRole;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const workspaceId = (body.workspaceId ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const inviteRole: WorkspaceMemberRole =
    body.inviteRole === "admin" ? "admin" : "member";

  if (!workspaceId || !email) {
    return NextResponse.json(
      { error: "Workspace und E-Mail sind erforderlich." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const allowed =
    (await isWorkspaceAdmin(supabase, user.id, workspaceId)) ||
    (await isAppAdmin(supabase, user.id));
  if (!allowed) {
    return NextResponse.json(
      { error: "Nur Workspace-Admins dürfen einladen." },
      { status: 403 },
    );
  }

  const token = randomUUID();
  const { error: insertErr } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    email,
    token,
    role: inviteRole,
    invited_by: user.id,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "Für diese E-Mail gibt es bereits eine offene Einladung." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  const { data: wsRow } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();
  const workspaceName = wsRow?.name?.trim() ?? "";

  try {
    const mail = await sendWorkspaceInviteEmail({
      to: email,
      token,
      workspaceName,
      appBaseUrl: await resolveMailAppBaseUrl(),
    });
    return NextResponse.json({
      token,
      error: null,
      mailSent: true,
      mailError: null,
      mailMessageId: mail.messageId,
      mailProvider: mail.provider,
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Unbekannter Fehler beim Mailversand.";
    return NextResponse.json({
      token,
      error: null,
      mailSent: false,
      mailError: msg,
    });
  }
}
