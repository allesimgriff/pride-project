import type { ProjectStatus } from "@/types/database";

/** „Aktiv“ für KPIs (Dashboard, Filter) – identisch zur bisherigen Client-Logik */
export const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  "idee",
  "konzept",
  "entwicklung",
  "muster",
  "freigabe",
];
