-- Zusätzliche Anzeige-Spalte für den Table Editor:
-- speichert die E-Mail zum user_id-Eintrag in workspace_members.

ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS workspace_name text;

-- Bestehende Datensätze nachziehen
UPDATE public.workspace_members wm
SET user_email = lower(trim(p.email))
FROM public.profiles p
WHERE p.id = wm.user_id
  AND (wm.user_email IS NULL OR wm.user_email <> lower(trim(p.email)));

UPDATE public.workspace_members wm
SET workspace_name = w.name
FROM public.workspaces w
WHERE w.id = wm.workspace_id
  AND (wm.workspace_name IS NULL OR wm.workspace_name <> w.name);

-- Beim Insert/Update in workspace_members user_email automatisch aus profiles setzen
CREATE OR REPLACE FUNCTION public.workspace_member_set_lookup_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT lower(trim(email))
  INTO NEW.user_email
  FROM public.profiles
  WHERE id = NEW.user_id;

  SELECT name
  INTO NEW.workspace_name
  FROM public.workspaces
  WHERE id = NEW.workspace_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_member_set_lookup_fields ON public.workspace_members;
CREATE TRIGGER trg_workspace_member_set_lookup_fields
BEFORE INSERT OR UPDATE OF user_id, workspace_id
ON public.workspace_members
FOR EACH ROW
EXECUTE FUNCTION public.workspace_member_set_lookup_fields();

-- Wenn sich die E-Mail im Profil ändert, in workspace_members spiegeln
CREATE OR REPLACE FUNCTION public.workspace_member_sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.workspace_members
    SET user_email = lower(trim(NEW.email))
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_member_sync_profile_email ON public.profiles;
CREATE TRIGGER trg_workspace_member_sync_profile_email
AFTER UPDATE OF email
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.workspace_member_sync_profile_email();

-- Wenn sich der Workspace-Name ändert, in workspace_members spiegeln
CREATE OR REPLACE FUNCTION public.workspace_member_sync_workspace_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.workspace_members
    SET workspace_name = NEW.name
    WHERE workspace_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_member_sync_workspace_name ON public.workspaces;
CREATE TRIGGER trg_workspace_member_sync_workspace_name
AFTER UPDATE OF name
ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.workspace_member_sync_workspace_name();
