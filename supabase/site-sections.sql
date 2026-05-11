create table if not exists public.site_sections (
  key text primary key,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_sections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_sections_updated_at on public.site_sections;

create trigger set_site_sections_updated_at
before update on public.site_sections
for each row
execute function public.set_site_sections_updated_at();

alter table public.site_sections enable row level security;

revoke all on public.site_sections from anon;
revoke all on public.site_sections from authenticated;
grant select, insert, update, delete on public.site_sections to service_role;

insert into public.site_sections (key, body)
values
  ('blogName', '지우 블로그'),
  (
    'intro',
    '소프트웨어와 디자인, 그리고 일하면서 떠오른 생각을 짧게 기록하는 공간입니다.' || E'\n\n' ||
    '글을 빠르게 훑고 편하게 읽을 수 있도록 화면은 조용하게 유지합니다.'
  ),
  (
    'about',
    '이 블로그는 소프트웨어, 디자인, 그리고 디지털 작업을 조금 더 낫게 만드는 작은 선택들을 기록하는 공간입니다.' || E'\n\n' ||
    '화면의 기본 구조는 Astro Nano의 미니멀한 리듬을 참고해 블로그에 맞게 적용했습니다.' || E'\n\n' ||
    '과한 장식보다 읽기 편한 간격과 목록 중심의 흐름을 우선합니다.'
  ),
  ('contacts', '안녕하세요. 이지우입니다.')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
