create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  tags text[] not null default '{}',
  content_html text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists posts_published_at_idx
  on public.posts (published_at desc)
  where deleted_at is null;

create index if not exists posts_tags_idx
  on public.posts using gin (tags)
  where deleted_at is null;

create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_posts_updated_at on public.posts;

create trigger set_posts_updated_at
before update on public.posts
for each row
execute function public.set_posts_updated_at();

alter table public.posts enable row level security;

revoke all on public.posts from anon;
revoke all on public.posts from authenticated;
grant select, insert, update, delete on public.posts to service_role;

notify pgrst, 'reload schema';
