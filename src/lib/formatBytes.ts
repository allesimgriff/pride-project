/** Kurze Anzeige z. B. für Speicherhinweise (dezimal, SI). */
export function formatBytes(bytes: number, locale: string = "de-DE"): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const digits = i === 0 ? 0 : i === 1 ? 0 : 1;
  return `${v.toLocaleString(locale, { maximumFractionDigits: digits })} ${units[i]}`;
}
