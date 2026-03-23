import { NextResponse } from "next/server";
import { leaveWorkspaceAction } from "@/app/actions/workspaces";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const result = await leaveWorkspaceAction(workspaceId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
