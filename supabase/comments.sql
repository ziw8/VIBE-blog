create extension if not exists pgcrypto;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (char_length(post_slug) between 1 and 160),
  parent_id uuid references public.comments(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  body text not null check (char_length(body) between 1 and 1000),
  emoji text constraint comments_emoji_check check (emoji is null or emoji in ('👍', '❤️', '🔥', '😆', '😲', '😭')),
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade;

update public.comments
set emoji = null
where emoji is not null
  and emoji not in ('👍', '❤️', '🔥', '😆', '😲', '😭');

alter table public.comments
  drop constraint if exists comments_emoji_check;

alter table public.comments
  add constraint comments_emoji_check
  check (emoji is null or emoji in ('👍', '❤️', '🔥', '😆', '😲', '😭'));

create index if not exists comments_post_slug_created_at_idx
  on public.comments (post_slug, created_at)
  where deleted_at is null;

create index if not exists comments_post_slug_parent_created_at_idx
  on public.comments (post_slug, parent_id, created_at)
  where deleted_at is null;

create or replace function public.set_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_comments_updated_at on public.comments;

create trigger set_comments_updated_at
before update on public.comments
for each row
execute function public.set_comments_updated_at();

alter table public.comments enable row level security;

revoke all on public.comments from anon;
revoke all on public.comments from authenticated;
grant select, insert, update, delete on public.comments to service_role;
