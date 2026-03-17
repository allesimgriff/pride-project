import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("email, full_name, accepted_at")
    .eq("token", token)
    .single();

  if (error || !data || data.accepted_at) {
    return new NextResponse("Invalid or used token", { status: 404 });
  }

  return NextResponse.json({
    email: data.email,
    full_name: data.full_name,
  });
}

