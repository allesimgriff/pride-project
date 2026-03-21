/** Präfix für Entwicklungsnummern: Leerzeichen → Unterstrich (z. B. „kat 1“ → kat_1). */
export function normalizeCategoryPrefix(raw: string): string {
  return raw.trim().replace(/\s+/g, "_");
}
