import { NextResponse } from "next/server";
import { acceptWorkspaceInviteAction } from "@/app/actions/workspaces";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  const result = await acceptWorkspaceInviteAction(token);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
