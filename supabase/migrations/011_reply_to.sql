-- 011_reply_to.sql
-- Support Telegram-style message replies: when a user replies to a
-- specific message, the new row stores the target's id so the chat UI
-- can render a quoted preview above the bubble and (on tap) scroll
-- to the original.

ALTER TABLE doc_comments
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES doc_comments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_doc_comments_reply_to
  ON doc_comments(reply_to_id)
  WHERE reply_to_id IS NOT NULL;
