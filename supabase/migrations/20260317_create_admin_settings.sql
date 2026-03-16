-- ─── Admin settings table ─────────────────────────────────────────────────────
-- General key-value store for admin panel:
--   admin_password_hash     — changed password hash (HMAC-SHA256)
--   translations_ru/kz/en   — i18n override blobs (JSON)

create table if not exists admin_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Only service_role can access admin_settings (API routes use service client)
alter table admin_settings enable row level security;

create policy "admin_settings_service_only"
  on admin_settings
  for all
  using (false);
