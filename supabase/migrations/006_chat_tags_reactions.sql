-- Chat refactor: one thread per (doc, client) pair with optional day tag,
-- reactions inline on messages, and attachments (photos / files / voice).

-- 1. Make `date` nullable — direct messages without a day tag
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='doc_comments' AND column_name='date' AND is_nullable='NO'
  ) THEN
    ALTER TABLE doc_comments ALTER COLUMN date DROP NOT NULL;
  END IF;
END $$;

-- 2. Reactions column — JSON map like {"❤️": ["uid1","uid2"], "🔥": ["uid3"]}
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='doc_comments' AND column_name='reactions'
  ) THEN
    ALTER TABLE doc_comments ADD COLUMN reactions jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 3. Attachments column — JSON array of {type, url, name?, size?}
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='doc_comments' AND column_name='attachments'
  ) THEN
    ALTER TABLE doc_comments ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 4. Index to speed up loading full thread for a pair
CREATE INDEX IF NOT EXISTS idx_doc_comments_pair
  ON doc_comments(doc_id, client_id, created_at);
