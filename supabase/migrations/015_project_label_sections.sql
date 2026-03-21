-- Zusätzliche editierbare Bereichs-Überschriften (Nr. 11–19)

INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  ('stammdatenHeading', 'Stammdaten', 'Master data', 11),
  ('photosHeading', 'Fotos zum Projekt', 'Photos for the project', 12),
  (
    'photosIntro',
    'Hier kannst du direkt vom Handy (Kamera/Galerie) oder vom Rechner Fotos hochladen.',
    'Upload photos from your phone (camera/gallery) or from your computer.',
    13
  ),
  ('commentsHeading', 'Kommentare', 'Comments', 14),
  ('tasksHeading', 'Aufgaben', 'Tasks', 15),
  ('checklistHeading', 'Checkliste', 'Checklist', 16),
  ('timelineHeading', 'Timeline', 'Timeline', 17),
  (
    'timelineSubtitle',
    'Wer hat wann etwas geschrieben, geändert oder hochgeladen',
    'Who wrote, changed or uploaded something and when',
    18
  ),
  ('historyHeading', 'Historie', 'History', 19)
ON CONFLICT (key) DO UPDATE SET
  label_de = EXCLUDED.label_de,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order;

-- „files“-Kachel: längerer Standardtext wie in der UI (i18n files.title)
UPDATE public.project_labels
SET
  label_de = 'Bilder, Zeichnungen, PDFs, Präsentationen',
  label_en = 'Images, drawings, PDFs, presentations'
WHERE key = 'files';
