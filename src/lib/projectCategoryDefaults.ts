/**
 * Standard für neu angelegte Workspaces (ein Eintrag pro Workspace).
 * Wird in `createWorkspaceAction` eingefügt; Migration 022 macht bestehende Daten workspace-spezifisch.
 */
export const DEFAULT_WORKSPACE_FIRST_CATEGORY = {
  name: "Kategorie 1",
  prefix: "kat_1",
  sortOrder: 1,
} as const;
