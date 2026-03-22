-- =============================================================================
-- NACH Schritt 1 – VOR Schritt 3
-- =============================================================================
-- ZUERST: Authentication → Users → mindestens EINEN User anlegen (E-Mail + Passwort).
-- Dann dieses Skript ausführen.
-- =============================================================================

-- Prüfen (sollte mindestens 1 Zeile bei users zeigen):
-- SELECT id, email FROM auth.users;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(NULLIF(TRIM(raw_user_meta_data->>'full_name'), ''), email), 'admin'::user_role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Muss genau 1+ Zeilen zurückgeben, sonst Schritt 3 scheitert:
-- SELECT id, email, role FROM public.profiles;
