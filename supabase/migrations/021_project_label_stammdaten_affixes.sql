-- Zusatz neben „Kategorie“ und „Entwicklungsnummer“ (z. B. * oder leer), getrennt editierbar

INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  ('categoryLabelPrefix', '', '', 1),
  ('devNumberLabelPrefix', '*', '*', 2)
ON CONFLICT (key) DO UPDATE SET
  label_de = EXCLUDED.label_de,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order;
