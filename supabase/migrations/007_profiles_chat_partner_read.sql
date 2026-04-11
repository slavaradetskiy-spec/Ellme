-- Allow chat partners to read each other's profile row (name, photo).
-- Previously a client could not read their nutritionist's profiles row,
-- so the chat header fell back to initials instead of the avatar.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='profiles_read_chat_partner'
  ) THEN
    CREATE POLICY "profiles_read_chat_partner" ON profiles
      FOR SELECT TO authenticated
      USING (
        -- You can always read your own row
        id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM doc_clients dc
          WHERE (dc.doc_id = auth.uid() AND dc.client_id = profiles.id)
             OR (dc.client_id = auth.uid() AND dc.doc_id = profiles.id)
        )
      );
  END IF;
END $$;
