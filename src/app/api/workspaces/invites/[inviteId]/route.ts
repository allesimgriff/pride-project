import { NextResponse } from "next/server";
import { revokeWorkspaceInviteAction } from "@/app/actions/workspaces";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await params;
  const result = await revokeWorkspaceInviteAction(inviteId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
