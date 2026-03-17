-- Mitarbeiter-Einladungen / Invites
-- Dieses Skript in Supabase im SQL-Editor ausführen.

CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'projektleitung',
  token UUID NOT NULL UNIQUE,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Nutzer dürfen Einladungen sehen
CREATE POLICY "Invites are viewable by authenticated users"
  ON public.invites FOR SELECT TO authenticated
  USING (true);

-- Nur Admin darf Einladungen anlegen
CREATE POLICY "Only admin can insert invites"
  ON public.invites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nur Admin darf Einladungen als angenommen markieren (optional, kann auch serverseitig ohne Policy laufen)
CREATE POLICY "Only admin can update invites"
  ON public.invites FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

