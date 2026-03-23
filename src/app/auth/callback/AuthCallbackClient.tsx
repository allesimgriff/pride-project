"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  inviteTokenFromNextPath,
  safeNext,
  withoutInviteTokenQuery,
} from "@/lib/authCallback";

async function markInviteAcceptedIfNeeded(
  supabase: ReturnType<typeof createClient>,
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

/**
 * PKCE-Tausch im Browser: Code-Verifizierer liegt in Cookies derselben Origin.
 * Wenn exchange fehlschlägt (z. B. doppelter Lauf in React Strict Mode), Session prüfen.
 */
export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const [hint, setHint] = useState("Anmeldung wird abgeschlossen …");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      if (searchParams.get("error")) {
        router.replace("/login?error=auth");
        return;
      }

      const next = safeNext(searchParams.get("next"));
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const otpType = searchParams.get("type");

      const supabase = createClient();

      if (code) {
        let exchangeErr = (await supabase.auth.exchangeCodeForSession(code))
          .error;
        if (exchangeErr) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            exchangeErr = null;
          } else {
            console.error(
              "[auth/callback] exchangeCodeForSession",
              exchangeErr.message,
            );
          }
        }
        if (!exchangeErr) {
          await markInviteAcceptedIfNeeded(supabase, next);
          router.replace(withoutInviteTokenQuery(next));
          return;
        }
      }

      if (tokenHash && otpType) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType as "signup" | "email" | "recovery" | "magiclink",
        });
        if (!error) {
          await markInviteAcceptedIfNeeded(supabase, next);
          router.replace(withoutInviteTokenQuery(next));
          return;
        }
        console.error("[auth/callback] verifyOtp", error.message);
      }

      setHint("");
      router.replace("/login?error=auth");
    }

    void run().catch(() => {
      router.replace("/login?error=auth");
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-gray-600">
      {hint}
    </div>
  );
}
