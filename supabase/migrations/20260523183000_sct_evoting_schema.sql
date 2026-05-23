create extension if not exists pgcrypto;

create table if not exists public.app_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'student', 'aspirant')),
  full_name text not null,
  matric_number text unique,
  department text not null,
  level text,
  password_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  id_card_image text,
  has_voted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  form_price numeric(12,2) not null default 0,
  eligible_levels text[] not null default '{}',
  max_selections integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.aspirants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  matric_number text not null,
  department text not null,
  level text not null,
  password_hash text not null,
  position_id uuid references public.positions(id) on delete set null,
  manifesto text not null,
  passport_image text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'verified', 'rejected')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  aspirant_id uuid references public.aspirants(id) on delete set null,
  full_name text not null,
  matric_number text,
  department text not null,
  level text,
  position_id uuid references public.positions(id) on delete cascade,
  manifesto text not null,
  photo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references public.users(id) on delete restrict,
  position_id uuid references public.positions(id) on delete restrict,
  candidate_id uuid references public.candidates(id) on delete restrict,
  department text not null,
  created_at timestamptz not null default now(),
  unique (voter_id, position_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.election_settings (
  id boolean primary key default true,
  portal_enabled boolean not null default false,
  start_at timestamptz not null,
  end_at timestamptz not null,
  departments text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint singleton_settings check (id)
);

alter table public.app_state enable row level security;
alter table public.users enable row level security;
alter table public.positions enable row level security;
alter table public.aspirants enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.election_settings enable row level security;

drop policy if exists "Allow app state reads" on public.app_state;
drop policy if exists "Allow app state writes" on public.app_state;

create policy "Allow app state reads"
on public.app_state
for select
to anon, authenticated
using (true);

create policy "Allow app state writes"
on public.app_state
for all
to anon, authenticated
using (true)
with check (true);
