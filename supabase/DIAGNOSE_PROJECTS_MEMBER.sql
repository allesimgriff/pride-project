-- Im Supabase SQL Editor ausführen (Rolle postgres).
-- Schritt 1: E-Mail des eingeloggten Users einsetzen → user_id merken.

SELECT id, email, created_at
FROM auth.users
WHERE lower(email) = lower('HIER_EMAIL_EINTRAGEN');

-- Schritt 2: USER_UUID durch die id aus Schritt 1 ersetzen.
-- Ergebnis projekte_mit_mitgliedschaft > 0 → Daten passen; dann ist es fast immer RLS/Policy.
-- Ergebnis 0 → es gibt keine Projekte im Workspace dieses Users.

SELECT
  (SELECT count(*)::int FROM workspace_members wm WHERE wm.user_id = 'USER_UUID') AS mitgliedschaften,
  (SELECT count(*)::int
   FROM projects p
   INNER JOIN workspace_members wm ON wm.workspace_id = p.workspace_id AND wm.user_id = 'USER_UUID'
  ) AS projekte_mit_mitgliedschaft;

-- Schritt 3 (optional): Policies auf public.projects prüfen

SELECT polname, cmd, permissive, roles::text, pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy
JOIN pg_class c ON c.oid = pg_policy.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'projects'
ORDER BY polname;
