create extension if not exists "pgcrypto";

create table if not exists public.analysis_records (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  quote_json jsonb not null,
  ai_json jsonb not null,
  created_at timestamptz default now()
);
