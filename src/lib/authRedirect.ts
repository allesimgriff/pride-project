import { getPublicAppBaseUrlFromEnv } from "@/lib/appPublicUrl";

/**
 * Prüft, ob emailRedirectTo zur laufenden App gehört (kein Open-Redirect).
 * Nicht nur Origin: Header fehlen bei manchen Proxys/CDNs; Host + NEXT_PUBLIC_APP_URL abfangen.
 */
export function isRedirectAllowedForSignup(
  request: Request,
  emailRedirectTo: string,
): boolean {
  const normalized = emailRedirectTo.trim();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    return false;
  }

  const envBase = getPublicAppBaseUrlFromEnv();
  if (envBase && normalized.startsWith(`${envBase}/`)) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (origin && normalized.startsWith(`${origin}/`)) {
    return true;
  }

  const hostRaw =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");
  if (!hostRaw) {
    return false;
  }

  const isLocal =
    hostRaw.startsWith("localhost") || hostRaw.startsWith("127.0.0.1");
  const protoHeader = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = isLocal
    ? "http"
    : protoHeader && protoHeader.length > 0
      ? protoHeader
      : "https";
  const built = `${proto}://${hostRaw}`;
  return normalized.startsWith(`${built}/`);
}
