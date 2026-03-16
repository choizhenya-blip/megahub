-- Add B2B visibility flag to books.
-- is_b2b_active = true  → book is shown in B2B portal (no price, cart → quote request)
-- is_active      = true → book is shown in public catalog with price

ALTER TABLE books ADD COLUMN IF NOT EXISTS is_b2b_active boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS books_b2b_active_idx ON books (is_b2b_active);
