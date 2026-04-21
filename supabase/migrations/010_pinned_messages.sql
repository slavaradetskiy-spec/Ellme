-- 010_pinned_messages.sql
-- Per-message pin flag. Telegram-style pin-to-top in chat: a message
-- can be pinned to show a banner above the scroll area; tapping the
-- banner scrolls to the original. Only one message is pinned at a
-- time per (doc, client) pair — pinning a new one unpins the rest
-- (handled in the client, cheap enough for chat scale).

ALTER TABLE doc_comments
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

-- Partial index — most rows are unpinned, so we only index the rare
-- pinned=true rows to keep the "load pinned banner" query fast.
CREATE INDEX IF NOT EXISTS idx_doc_comments_pinned
  ON doc_comments(client_id, pinned)
  WHERE pinned = true;
