-- Trigger entfernen – User-Erstellung im Supabase-Dashboard funktioniert dann wieder.
-- Das Profil wird beim ersten Login in der App angelegt.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
