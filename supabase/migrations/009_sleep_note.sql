-- 009_sleep_note.sql
-- Free-text note for a night's sleep ("what was memorable, dreams,
-- wake-ups…"). Captured via the same voice-dictation Area used for
-- the day comment and stress details.

ALTER TABLE diary_days
  ADD COLUMN IF NOT EXISTS sleep_note text;
