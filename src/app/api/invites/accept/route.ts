import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, accepted_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return new NextResponse("Invalid token", { status: 404 });
  }

  if (!data.accepted_at) {
    await supabase
      .from("invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return NextResponse.json({ ok: true });
}

