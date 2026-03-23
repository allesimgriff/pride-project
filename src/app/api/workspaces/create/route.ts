import { NextResponse } from "next/server";
import { createWorkspaceAction } from "@/app/actions/workspaces";

export async function POST(request: Request) {
  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name : "";
  const result = await createWorkspaceAction(name);
  if (result.error) {
    return NextResponse.json({ error: result.error, id: null }, { status: 400 });
  }
  return NextResponse.json({ id: result.id, error: null });
}
