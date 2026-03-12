-- Add description field to books for admin panel
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;

-- Admin settings table (for sync toggle etc.)
CREATE TABLE IF NOT EXISTS admin_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default: auto-sync disabled
INSERT INTO admin_settings (key, value)
VALUES ('sync_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- RLS: only service_role can access admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role only" ON admin_settings
  USING (auth.role() = 'service_role');
