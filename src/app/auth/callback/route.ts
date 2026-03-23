import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Nur Pfade auf derselben Origin (kein Open-Redirect). */
function safeNext(raw: string | null): string {
  if (!raw) return "/projects";
  let t = raw;
  try {
    t = decodeURIComponent(raw);
  } catch {
    return "/projects";
  }
  t = t.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/projects";
  return t;
}

function inviteTokenFromNextPath(path: string): string | null {
  const q = path.indexOf("?");
  if (q === -1) return null;
  const params = new URLSearchParams(path.slice(q + 1));
  return params.get("invite_token");
}

/** Nach mark_invite_accepted: Login-URL ohne sichtbaren Token. */
function withoutInviteTokenQuery(path: string): string {
  const q = path.indexOf("?");
  if (q === -1) return path;
  const params = new URLSearchParams(path.slice(q + 1));
  params.delete("invite_token");
  const base = path.slice(0, q);
  const rest = params.toString();
  return rest ? `${base}?${rest}` : base;
}

async function markInviteAcceptedIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nextPath: string,
) {
  const tok = inviteTokenFromNextPath(nextPath);
  if (!tok) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const em = user?.email;
  if (!em) return;
  const { error } = await supabase.rpc("mark_invite_accepted", {
    p_token: tok,
    p_email: em,
  });
  if (error) {
    console.error("[auth/callback] mark_invite_accepted", error.message);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;

  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const next = safeNext(searchParams.get("next"));

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await markInviteAcceptedIfNeeded(supabase, next);
      const target = withoutInviteTokenQuery(next);
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "magiclink",
    });
    if (!error) {
      await markInviteAcceptedIfNeeded(supabase, next);
      const target = withoutInviteTokenQuery(next);
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
