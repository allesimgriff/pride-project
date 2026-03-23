/** UUID aus Query-Parameter; robust gegen Mail-Scanner, Zeilenumbrüche, angehängte Zeichen. */
const UUID_IN_STRING =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function parseInviteTokenFromQuery(raw: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* ungültiges %-Encoding */
  }
  s = s.trim().replace(/\s+/g, "");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
    return s;
  }
  const m = s.match(UUID_IN_STRING);
  return m ? m[0] : null;
}
