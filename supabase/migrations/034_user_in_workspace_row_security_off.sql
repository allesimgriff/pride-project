-- user_in_workspace / user_is_workspace_admin lesen workspace_members zur Mitgliedschaftsprüfung.
-- Ohne SET row_security = off wertet Postgres RLS oft im Kontext des Aufrufers aus;
-- dann kann die EXISTS-Prüfung keine Zeile sehen → false → keine sichtbaren Projekte für Mitglieder.
-- Die Funktionen bleiben eingeschränkt: nur Zeilen mit wm.user_id = auth.uid() zählen.

CREATE OR REPLACE FUNCTION public.user_in_workspace(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = wid AND wm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_in_workspace(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.user_in_workspace(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_is_workspace_admin(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = wid
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_workspace_admin(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.user_is_workspace_admin(uuid) TO authenticated;
