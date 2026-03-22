/**
 * Produkt-Edition: gleicher Code-Stand, Steuerung pro Netlify-Site via NEXT_PUBLIC_APP_EDITION.
 * - pride: volle Oberfläche (inline Überschriften, Fotoblock, Workspace verschieben, …)
 * - handwerker: reduzierte Oberfläche
 */

export type AppEdition = "pride" | "handwerker";

export function getAppEdition(): AppEdition {
  const raw = process.env.NEXT_PUBLIC_APP_EDITION?.trim().toLowerCase();
  if (raw === "handwerker" || raw === "hw") return "handwerker";
  return "pride";
}

export function isPrideEdition(): boolean {
  return getAppEdition() === "pride";
}

export function isHandwerkerEdition(): boolean {
  return getAppEdition() === "handwerker";
}
