import type { AppEdition } from "@/lib/appEdition";

/** PRIDE: Name inkl. Präfix in Klammern; Handwerker: nur Name. */
export function formatCategoryLabel(name: string, prefix: string, edition: AppEdition): string {
  if (edition === "handwerker") return name;
  return `${name} (${prefix})`;
}
