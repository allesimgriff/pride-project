import { NextResponse } from "next/server";
import {
  removeWorkspaceMemberAction,
  setWorkspaceMemberRoleAction,
} from "@/app/actions/workspaces";
import type { WorkspaceMemberRole } from "@/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  const { workspaceId, userId } = await params;
  let body: { role?: WorkspaceMemberRole };
  try {
    body = (await request.json()) as { role?: WorkspaceMemberRole };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const role = body.role;
  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }
  const result = await setWorkspaceMemberRoleAction(workspaceId, userId, role);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  const { workspaceId, userId } = await params;
  const result = await removeWorkspaceMemberAction(workspaceId, userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
