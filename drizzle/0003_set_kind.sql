-- Warm-up vs working sets. Additive + defaulted: every existing row becomes 'working',
-- so historical volume / PR / 1RM analytics are unchanged. No data is modified or removed.
ALTER TABLE "set_entries" ADD COLUMN "kind" text NOT NULL DEFAULT 'working';
