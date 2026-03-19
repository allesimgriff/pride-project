-- Admin darf Einladungen löschen (Widerrufen)

CREATE POLICY "Only admin can delete invites"
  ON public.invites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

