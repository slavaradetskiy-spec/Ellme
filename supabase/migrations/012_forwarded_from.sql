-- 012_forwarded_from.sql
-- Telegram-style forward attribution: when a message is forwarded into
-- another chat, we keep the original sender's display name on the new
-- row so the bubble can render "Переслано от X". The referenced
-- message itself may live in a different thread and might be deleted
-- later, so we store just the name (text) rather than an id.

ALTER TABLE doc_comments
  ADD COLUMN IF NOT EXISTS forwarded_from_name text;
