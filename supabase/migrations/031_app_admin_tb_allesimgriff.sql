-- App-Administrator: tb@allesimgriff.de
-- Wirkt nur, wenn ein Profil mit dieser E-Mail existiert (Nutzer hat sich mindestens einmal registriert).

UPDATE public.profiles
SET role = 'admin'
WHERE lower(trim(email)) = lower(trim('tb@allesimgriff.de'));
