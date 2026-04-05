-- Allow clients to insert into doc_clients when they have a valid (unused) invite code
-- This is needed for the invite flow: client registers via invite link → loadProfile inserts doc_clients row

-- Allow authenticated users to INSERT into doc_clients (for invite linking)
CREATE POLICY "clients_can_link_via_invite" ON doc_clients
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM invites
      WHERE invites.doc_id = doc_clients.doc_id
        AND invites.used = false
    )
  );

-- Allow authenticated users to SELECT their own doc_clients rows
CREATE POLICY "users_can_see_own_links" ON doc_clients
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR doc_id = auth.uid());

-- Allow clients to update invites they're using (mark as used)
CREATE POLICY "clients_can_use_invites" ON invites
  FOR UPDATE TO authenticated
  USING (used = false)
  WITH CHECK (used_by = auth.uid());
