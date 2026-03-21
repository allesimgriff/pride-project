-- Entfernt nicht mehr genutzte Label-Keys (Zusatz neben Überschrift / Kategorien-Fußnote).

DELETE FROM public.workspace_project_labels
WHERE key IN (
  'categoryLabelPrefix',
  'devNumberLabelPrefix',
  'categoriesPrefixFootnote'
);

DELETE FROM public.project_labels
WHERE key IN (
  'categoryLabelPrefix',
  'devNumberLabelPrefix',
  'categoriesPrefixFootnote'
);
