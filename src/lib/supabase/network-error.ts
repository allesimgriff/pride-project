/** Technische Kurzbeschreibung für Logs / Dev-Responses (Node „fetch failed“ + ggf. cause). */
export function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const base = err.message;
  const c = "cause" in err && err.cause instanceof Error ? err.cause.message : "";
  return c ? `${base} (${c})` : base;
}
