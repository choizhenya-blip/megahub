-- Add multilingual descriptions and image gallery to books table

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS description_ru TEXT,
  ADD COLUMN IF NOT EXISTS description_kz TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS images         JSONB DEFAULT '[]'::jsonb;

-- Backfill: copy existing description → description_ru
UPDATE books
SET description_ru = description
WHERE description_ru IS NULL AND description IS NOT NULL;

-- Backfill: if cover_image_url exists and images is empty, seed the array
UPDATE books
SET images = jsonb_build_array(cover_image_url)
WHERE cover_image_url IS NOT NULL
  AND (
    images IS NULL
    OR images = 'null'::jsonb
    OR jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0
  );
