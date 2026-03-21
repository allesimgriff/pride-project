-- Erklärungstext unter der Kategorien-Tabelle (global, nur App-Admin)

INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  (
    'categoriesPrefixFootnote',
    '* (das, was vor einer laufenden Nummerierung stehen soll, die automatisch generiert wird).',
    '* (the text that should appear before the automatically generated serial number).',
    21
  )
ON CONFLICT (key) DO NOTHING;
