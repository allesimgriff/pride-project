-- workspace_members_select: eigene Zeilen explizit erlauben (user_id = auth.uid()),
-- damit die Policy nicht von user_in_workspace() abhängt, das wieder workspace_members liest
-- (RLS-Rekursion / leere Ergebnisse bei Mitgliedern).

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;

CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );
