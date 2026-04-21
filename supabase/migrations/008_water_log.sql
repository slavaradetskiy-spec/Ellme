-- 008_water_log.sql
-- Add a per-day JSONB log of individual water entries so the list of
-- cups survives across devices / browsers / incognito (localStorage
-- alone is wiped in private sessions and does not roam).
--
-- Shape: water_log = [{ "ml": 250, "time": "18:08" }, ...]
-- water_ml remains the canonical total (sum of log + any legacy
-- unaccounted amount carried by older clients).

ALTER TABLE diary_days
  ADD COLUMN IF NOT EXISTS water_log jsonb NOT NULL DEFAULT '[]'::jsonb;
