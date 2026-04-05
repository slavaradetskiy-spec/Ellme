-- Recreate doc_comments as a proper chat table
-- First check if columns exist, add missing ones

-- Add sender_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doc_comments' AND column_name='sender_id') THEN
    ALTER TABLE doc_comments ADD COLUMN sender_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Add sender_name for display
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doc_comments' AND column_name='sender_name') THEN
    ALTER TABLE doc_comments ADD COLUMN sender_name text;
  END IF;
END $$;

-- Add read flag
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doc_comments' AND column_name='read') THEN
    ALTER TABLE doc_comments ADD COLUMN read boolean DEFAULT false;
  END IF;
END $$;

-- Ensure created_at exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doc_comments' AND column_name='created_at') THEN
    ALTER TABLE doc_comments ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- RLS policies for doc_comments
-- Docs can read/write comments for their clients
CREATE POLICY IF NOT EXISTS "doc_can_manage_comments" ON doc_comments
  FOR ALL TO authenticated
  USING (doc_id = auth.uid())
  WITH CHECK (doc_id = auth.uid());

-- Clients can read their own comments and insert new ones
CREATE POLICY IF NOT EXISTS "client_can_read_own_comments" ON doc_comments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY IF NOT EXISTS "client_can_send_comments" ON doc_comments
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid() AND sender_id = auth.uid());

-- Client can mark comments as read
CREATE POLICY IF NOT EXISTS "client_can_mark_read" ON doc_comments
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE doc_comments;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_doc_comments_client ON doc_comments(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_doc_comments_doc ON doc_comments(doc_id, client_id, created_at);
