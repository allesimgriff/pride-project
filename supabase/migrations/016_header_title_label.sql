-- App-Kopfzeile (global, nur App-Admin) — inline bearbeitbar wie andere project_labels

INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  (
    'headerTitle',
    'Projektname',
    'Project name',
    20
  )
ON CONFLICT (key) DO NOTHING;
