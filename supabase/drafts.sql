create extension if not exists pgcrypto;

create table if not exists public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 120),
  tags text[] not null default '{}',
  content_html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_drafts_updated_at_idx
  on public.post_drafts (updated_at desc);

create or replace function public.set_post_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_post_drafts_updated_at on public.post_drafts;

create trigger set_post_drafts_updated_at
before update on public.post_drafts
for each row
execute function public.set_post_drafts_updated_at();

alter table public.post_drafts enable row level security;

revoke all on public.post_drafts from anon;
revoke all on public.post_drafts from authenticated;
grant select, insert, update, delete on public.post_drafts to service_role;

notify pgrst, 'reload schema';
