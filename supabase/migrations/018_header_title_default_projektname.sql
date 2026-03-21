-- Standard-Kopfzeile: „Projektname“ (bereits eingeführte DBs mit altem Standardtext anpassen)

UPDATE public.project_labels
SET
  label_de = 'Projektname',
  label_en = 'Project name'
WHERE key = 'headerTitle'
  AND (
    label_de = 'Produktentwicklung Polstermöbel'
    OR label_en = 'Product Development Upholstery'
  );
