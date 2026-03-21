import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/public-env";

export function createClient() {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new Error(
      "Supabase: In .env.local fehlen NEXT_PUBLIC_SUPABASE_URL oder öffentlicher Key (NEXT_PUBLIC_SUPABASE_ANON_KEY oder NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY; Dev-Server neu starten).",
    );
  }
  return createBrowserClient(cfg.url, cfg.anonKey);
}
