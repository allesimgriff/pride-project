export type ProjectLabelKey =
  | "category"
  | "devNumber"
  | "productName"
  | "status"
  | "description"
  | "files"
  | "technicalNotes"
  | "functions"
  | "materials"
  | "openPoints";

export type ProjectLabelRow = {
  key: ProjectLabelKey;
  label_de: string;
  label_en: string;
  sort_order: number;
};

export const PROJECT_LABEL_DEFAULTS: ProjectLabelRow[] = [
  { key: "category", label_de: "Kategorie", label_en: "Category", sort_order: 1 },
  { key: "devNumber", label_de: "Entwicklungsnummer", label_en: "Dev number", sort_order: 2 },
  { key: "productName", label_de: "Produktname", label_en: "Product name", sort_order: 3 },
  { key: "status", label_de: "Status", label_en: "Status", sort_order: 4 },
  { key: "description", label_de: "Beschreibung", label_en: "Description", sort_order: 5 },
  { key: "files", label_de: "Dateien", label_en: "Files", sort_order: 6 },
  { key: "technicalNotes", label_de: "Technische Merkmale", label_en: "Technical details", sort_order: 7 },
  { key: "functions", label_de: "Funktionen", label_en: "Functions", sort_order: 8 },
  { key: "materials", label_de: "Materialien", label_en: "Materials", sort_order: 9 },
  { key: "openPoints", label_de: "Offene Punkte", label_en: "Open points", sort_order: 10 },
];

export type ProjectLabelMap = Partial<Record<ProjectLabelKey, { de: string; en: string }>>;

export function buildProjectLabelMap(
  rows: Array<{ key: string; label_de: string; label_en: string }> | null | undefined
): ProjectLabelMap {
  const map: ProjectLabelMap = {};

  PROJECT_LABEL_DEFAULTS.forEach((d) => {
    map[d.key] = { de: d.label_de, en: d.label_en };
  });

  (rows || []).forEach((row) => {
    const key = row.key as ProjectLabelKey;
    if (!PROJECT_LABEL_DEFAULTS.some((d) => d.key === key)) return;
    map[key] = { de: row.label_de, en: row.label_en };
  });

  return map;
}

/** Globale `project_labels` + optionale Overrides aus `workspace_project_labels` (Workspace gewinnt). */
export function buildMergedProjectLabelMap(
  globalRows: Array<{ key: string; label_de: string; label_en: string }> | null | undefined,
  workspaceRows: Array<{ key: string; label_de: string; label_en: string }> | null | undefined,
): ProjectLabelMap {
  const map = buildProjectLabelMap(globalRows);
  (workspaceRows || []).forEach((row) => {
    const key = row.key as ProjectLabelKey;
    if (!PROJECT_LABEL_DEFAULTS.some((d) => d.key === key)) return;
    map[key] = { de: row.label_de, en: row.label_en };
  });
  return map;
}

export function projectLabelMapToRows(map: ProjectLabelMap): ProjectLabelRow[] {
  return PROJECT_LABEL_DEFAULTS.map((d) => ({
    key: d.key,
    label_de: map[d.key]?.de ?? d.label_de,
    label_en: map[d.key]?.en ?? d.label_en,
    sort_order: d.sort_order,
  }));
}

export function projectLabelRowsToMap(rows: ProjectLabelRow[]): ProjectLabelMap {
  const map: ProjectLabelMap = {};
  rows.forEach((r) => {
    map[r.key] = { de: r.label_de, en: r.label_en };
  });
  return map;
}

