-- Eine Datei-ID pro Projekt (ältestes project_files pro project_id) für Listen-Thumbnails.
-- Vermeidet das Laden aller Dateizeilen bei Dashboard / Projekte.

CREATE OR REPLACE FUNCTION public.first_file_id_per_project(p_ids uuid[])
RETURNS TABLE (project_id uuid, file_id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (pf.project_id)
    pf.project_id,
    pf.id AS file_id
  FROM public.project_files pf
  WHERE pf.project_id = ANY (p_ids)
  ORDER BY pf.project_id, pf.created_at ASC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.first_file_id_per_project(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.first_file_id_per_project(uuid[]) TO authenticated;
