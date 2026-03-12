-- Add multilingual title fields, ISBN, author, and B2G price to books table
-- All columns added with IF NOT EXISTS to be idempotent

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS isbn        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS title_ru    TEXT,
  ADD COLUMN IF NOT EXISTS title_kz    TEXT,
  ADD COLUMN IF NOT EXISTS title_en    TEXT,
  ADD COLUMN IF NOT EXISTS author      TEXT,
  ADD COLUMN IF NOT EXISTS price_b2g   NUMERIC(10,2);

-- Backfill: if books already have a `title` column, copy it to title_ru
-- (safe to run even if title_ru already has data — only fills nulls)
UPDATE books
SET title_ru = title
WHERE title_ru IS NULL AND title IS NOT NULL;
