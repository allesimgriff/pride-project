/**
 * Öffentliche Basis-URL der App (je Netlify-Site / .env).
 * NEXT_PUBLIC_* wird beim Build eingesetzt — pro Site muss die passende URL gesetzt sein.
 */
export function getPublicAppBaseUrlFromEnv(): string | null {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!u) return null;
  return u.replace(/\/$/, "");
}
