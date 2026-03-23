import { NextResponse } from "next/server";
import { deleteWorkspaceAction, updateWorkspaceNameAction } from "@/app/actions/workspaces";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name : "";
  const result = await updateWorkspaceNameAction(workspaceId, name);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const result = await deleteWorkspaceAction(workspaceId);
  if (!result.ok) {
    if (result.blockingProjectCount != null) {
      return NextResponse.json(
        { ok: false, blockingProjectCount: result.blockingProjectCount, error: result.error },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: result.error ?? "Fehler." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
