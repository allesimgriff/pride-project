/**
 * Produkt-Edition: gleicher Code-Stand, Steuerung pro Netlify-Site via NEXT_PUBLIC_APP_EDITION.
 * - pride: volle Oberfläche (inline Überschriften, Fotoblock, Workspace verschieben, …)
 * - handwerker: reduzierte Oberfläche
 *
 * Zusätzlich: resolveAppEdition() wertet den **Hostnamen** aus (PRIDE- vs Handwerker-Domain),
 * falls die Netlify-Env falsch gesetzt ist (sonst wirkt z. B. pride-project wie Handwerker).
 */

import { headers } from "next/headers";

export type AppEdition = "pride" | "handwerker";

/** Erkennt PRIDE- bzw. Handwerker-Deployments an der öffentlichen Domain (inkl. Deploy-Previews). */
export function editionFromHostname(host: string): AppEdition | null {
  const h = host.toLowerCase().trim();
  if (!h) return null;
  if (h.includes("pride-project.netlify.app")) return "pride";
  if (h.includes("handwerker-allesimgriff.netlify.app")) return "handwerker";
  return null;
}

/** Nur Build-/Env-Stand (ohne Request). Für Layouts mit Host: resolveAppEdition() bevorzugen. */
export function getAppEdition(): AppEdition {
  const raw = process.env.NEXT_PUBLIC_APP_EDITION?.trim().toLowerCase();
  if (raw === "handwerker" || raw === "hw") return "handwerker";
  return "pride";
}

/** Request: Hostname hat Vorrang vor NEXT_PUBLIC_APP_EDITION (falsche Netlify-Variable abfangen). */
export async function resolveAppEdition(): Promise<AppEdition> {
  try {
    const h = await headers();
    const host =
      h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "";
    const fromHost = editionFromHostname(host);
    if (fromHost) return fromHost;
  } catch {
    /* kein Request-Kontext */
  }
  return getAppEdition();
}

export function isPrideEdition(): boolean {
  return getAppEdition() === "pride";
}

export function isHandwerkerEdition(): boolean {
  return getAppEdition() === "handwerker";
}
