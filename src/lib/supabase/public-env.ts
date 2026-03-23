/**
 * Liest die öffentlichen Supabase-Variablen mit .trim().
 * Verhindert u. a. ungültige Request-URLs bei CRLF/Leerzeichen in .env.local (Windows).
 */
function resolvePublicSupabaseUrl(): string | undefined {
  const direct = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (direct) return direct;
  /** Netlify-Supabase-Extension setzt ggf. nur NEXT_PUBLIC_SUPABASE_DATABASE_URL (HTTPS-API-URL). */
  const fromExt = process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL?.trim();
  if (
    fromExt &&
    fromExt.startsWith("https://") &&
    fromExt.includes(".supabase.co")
  ) {
    return fromExt;
  }
  return undefined;
}

export function getSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = resolvePublicSupabaseUrl();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
