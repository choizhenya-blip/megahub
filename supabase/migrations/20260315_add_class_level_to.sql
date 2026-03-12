-- Add class_level_to for books that cover a range of classes (e.g. 7–9 grade)
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS class_level_to INT;

-- Default: set class_level_to = class_level for existing books (single-class)
UPDATE books
SET class_level_to = class_level
WHERE class_level IS NOT NULL AND class_level_to IS NULL;
