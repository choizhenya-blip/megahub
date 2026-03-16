-- ─── Admin users table ───────────────────────────────────────────────────────
-- Allows multiple admin accounts with role-based access control.
-- The original ADMIN_PASSWORD env var still works for the primary admin.

create table if not exists admin_users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  password_hash text not null,  -- HMAC-SHA256 of pwd:<password>
  role       text not null default 'manager'
               check (role in ('super_admin','manager','editor','viewer')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only service_role can access admin_users
alter table admin_users enable row level security;

create policy "admin_users_service_only"
  on admin_users
  for all
  using (false); -- block all anon/authenticated access; only service_role bypasses RLS

-- ─── B2B / Wholesale portal users ────────────────────────────────────────────
create table if not exists b2b_users (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  password_hash    text not null,  -- bcrypt or HMAC-SHA256
  company_name     text,
  contact_name     text not null,
  phone            text,
  bin              text,           -- Business Identification Number (БИН)
  company_type     text,           -- 'school','akimat','college','shop','other'
  email_verified   boolean not null default false,
  verify_token     text unique,    -- one-time token for email confirmation
  verify_expires   timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table b2b_users enable row level security;

create policy "b2b_users_service_only"
  on b2b_users
  for all
  using (false); -- only service_role

-- ─── B2B quote orders (wholesale requests) ───────────────────────────────────
create table if not exists b2b_quotes (
  id            uuid primary key default gen_random_uuid(),
  b2b_user_id   uuid not null references b2b_users(id) on delete cascade,
  items         jsonb not null default '[]',   -- [{book_id, sku, title_ru, qty}]
  comment       text,
  status        text not null default 'new'
                  check (status in ('new','in_review','priced','completed','cancelled')),
  manager_notes text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table b2b_quotes enable row level security;

create policy "b2b_quotes_service_only"
  on b2b_quotes
  for all
  using (false);

create index if not exists b2b_quotes_user_idx on b2b_quotes(b2b_user_id);
create index if not exists b2b_quotes_status_idx on b2b_quotes(status);
create index if not exists b2b_quotes_created_idx on b2b_quotes(created_at desc);
