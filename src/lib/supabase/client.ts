import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/public-env";

export function createClient() {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new Error(
      "Supabase: In .env.local fehlen NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY (Datei speichern, Dev-Server neu starten).",
    );
  }
  return createBrowserClient(cfg.url, cfg.anonKey);
}
