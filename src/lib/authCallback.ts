/** Gemeinsame Logik für /auth/callback (Open-Redirect vermeiden). */

export function safeNext(raw: string | null): string {
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

export function inviteTokenFromNextPath(path: string): string | null {
  const q = path.indexOf("?");
  if (q === -1) return null;
  const params = new URLSearchParams(path.slice(q + 1));
  return params.get("invite_token");
}

export function withoutInviteTokenQuery(path: string): string {
  const q = path.indexOf("?");
  if (q === -1) return path;
  const params = new URLSearchParams(path.slice(q + 1));
  params.delete("invite_token");
  const base = path.slice(0, q);
  const rest = params.toString();
  return rest ? `${base}?${rest}` : base;
}
