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
  | "openPoints"
  | "stammdatenHeading"
  | "photosHeading"
  | "photosIntro"
  | "commentsHeading"
  | "tasksHeading"
  | "checklistHeading"
  | "timelineHeading"
  | "timelineSubtitle"
  | "historyHeading"
  | "headerTitle";

export type ProjectLabelRow = {
  key: ProjectLabelKey;
  label_de: string;
  label_en: string;
  sort_order: number;
};

/** Kurzbeschreibung pro Schlüssel (Tabellenspalte „Feld“) — unabhängig vom bearbeitbaren Text. */
export const PROJECT_LABEL_KEY_HINTS: Record<ProjectLabelKey, { de: string; en: string }> = {
  category: { de: "Kategorie", en: "Category" },
  devNumber: { de: "Entwicklungsnummer", en: "Dev number" },
  productName: { de: "Produktname", en: "Product name" },
  status: { de: "Status", en: "Status" },
  description: { de: "Beschreibung", en: "Description" },
  files: { de: "Dateien-Kachel", en: "Files block" },
  technicalNotes: { de: "Technische Merkmale", en: "Technical details" },
  functions: { de: "Funktionen", en: "Functions" },
  materials: { de: "Materialien", en: "Materials" },
  openPoints: { de: "Offene Punkte", en: "Open points" },
  stammdatenHeading: { de: "Kachel „Stammdaten“", en: "“Master data” block title" },
  photosHeading: { de: "Kachel „Fotos“ (Überschrift)", en: "Photos block (heading)" },
  photosIntro: { de: "Kachel „Fotos“ (Hinweistext)", en: "Photos block (intro)" },
  commentsHeading: { de: "Kachel „Kommentare“", en: "Comments block" },
  tasksHeading: { de: "Kachel „Aufgaben“", en: "Tasks block" },
  checklistHeading: { de: "Kachel „Checkliste“", en: "Checklist block" },
  timelineHeading: { de: "Kachel „Timeline“ (Überschrift)", en: "Timeline (heading)" },
  timelineSubtitle: { de: "Kachel „Timeline“ (Unterzeile)", en: "Timeline (subtitle)" },
  historyHeading: { de: "Kachel „Historie“", en: "History block" },
  headerTitle: { de: "Hauptüberschrift (oben)", en: "Main heading (top bar)" },
};

export const PROJECT_LABEL_DEFAULTS: ProjectLabelRow[] = [
  { key: "category", label_de: "Kategorie", label_en: "Category", sort_order: 1 },
  { key: "devNumber", label_de: "Entwicklungsnummer", label_en: "Dev number", sort_order: 2 },
  { key: "productName", label_de: "Produktname", label_en: "Product name", sort_order: 3 },
  { key: "status", label_de: "Status", label_en: "Status", sort_order: 4 },
  { key: "description", label_de: "Beschreibung", label_en: "Description", sort_order: 5 },
  { key: "files", label_de: "Bilder, Zeichnungen, PDFs, Präsentationen", label_en: "Images, drawings, PDFs, presentations", sort_order: 6 },
  { key: "technicalNotes", label_de: "Technische Merkmale", label_en: "Technical details", sort_order: 7 },
  { key: "functions", label_de: "Funktionen", label_en: "Functions", sort_order: 8 },
  { key: "materials", label_de: "Materialien", label_en: "Materials", sort_order: 9 },
  { key: "openPoints", label_de: "Offene Punkte", label_en: "Open points", sort_order: 10 },
  { key: "stammdatenHeading", label_de: "Stammdaten", label_en: "Master data", sort_order: 11 },
  { key: "photosHeading", label_de: "Fotos zum Projekt", label_en: "Photos for the project", sort_order: 12 },
  {
    key: "photosIntro",
    label_de: "Hier kannst du direkt vom Handy (Kamera/Galerie) oder vom Rechner Fotos hochladen.",
    label_en: "Upload photos from your phone (camera/gallery) or from your computer.",
    sort_order: 13,
  },
  { key: "commentsHeading", label_de: "Kommentare", label_en: "Comments", sort_order: 14 },
  { key: "tasksHeading", label_de: "Aufgaben", label_en: "Tasks", sort_order: 15 },
  { key: "checklistHeading", label_de: "Checkliste", label_en: "Checklist", sort_order: 16 },
  { key: "timelineHeading", label_de: "Timeline", label_en: "Timeline", sort_order: 17 },
  {
    key: "timelineSubtitle",
    label_de: "Wer hat wann etwas geschrieben, geändert oder hochgeladen",
    label_en: "Who wrote, changed or uploaded something and when",
    sort_order: 18,
  },
  { key: "historyHeading", label_de: "Historie", label_en: "History", sort_order: 19 },
  {
    key: "headerTitle",
    label_de: "Projektname",
    label_en: "Project name",
    sort_order: 20,
  },
];

/** Gleiche Nummern wie in der Überschriften-Tabelle (Spalte „Nr.“). */
export const PROJECT_LABEL_SORT_ORDER: Record<ProjectLabelKey, number> = Object.fromEntries(
  PROJECT_LABEL_DEFAULTS.map((d) => [d.key, d.sort_order]),
) as Record<ProjectLabelKey, number>;

export type ProjectLabelMap = Partial<Record<ProjectLabelKey, { de: string; en: string }>>;

export function buildProjectLabelMap(
  rows: Array<{ key: string; label_de: string; label_en: string }> | null | undefined,
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

/** DB-Zeilen mit festem `PROJECT_LABEL_DEFAULTS` zusammenführen (fehlende Keys = Defaults). */
export function mergeProjectLabelRowsFromDb(
  rows: Array<{ key: string; label_de: string; label_en: string; sort_order?: number }> | null | undefined,
): ProjectLabelRow[] {
  const map = new Map(rows?.map((r) => [r.key as ProjectLabelKey, r]) ?? []);
  return PROJECT_LABEL_DEFAULTS.map((d) => {
    const row = map.get(d.key);
    if (row) {
      return {
        key: d.key,
        label_de: row.label_de,
        label_en: row.label_en,
        sort_order: d.sort_order,
      };
    }
    return d;
  });
}
