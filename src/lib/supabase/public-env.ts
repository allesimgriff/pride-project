/**
 * Liest die öffentlichen Supabase-Variablen mit .trim().
 * Verhindert u. a. ungültige Request-URLs bei CRLF/Leerzeichen in .env.local (Windows).
 */
export function getSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
