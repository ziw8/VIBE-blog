create extension if not exists pgcrypto;

create table if not exists public.post_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 32),
  aliases text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists post_tags_active_name_idx
  on public.post_tags (lower(name))
  where deleted_at is null;

create or replace function public.set_post_tags_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_post_tags_updated_at on public.post_tags;

create trigger set_post_tags_updated_at
before update on public.post_tags
for each row
execute function public.set_post_tags_updated_at();

alter table public.post_tags enable row level security;

revoke all on public.post_tags from anon;
revoke all on public.post_tags from authenticated;
grant select, insert, update, delete on public.post_tags to service_role;

insert into public.post_tags (name)
values ('Build'), ('Design'), ('Notes')
on conflict do nothing;

notify pgrst, 'reload schema';
