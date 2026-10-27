-- CapstoneCue schema. Run once in the Supabase SQL Editor for this project.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'My capstone' check (char_length(name) between 1 and 80),
  idea text not null default '' check (char_length(idea) <= 600),
  github_url text,
  deployment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.criteria (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 90),
  description text not null check (char_length(description) <= 360),
  category text not null check (category in ('Idea','MVP','Launch','Users','Pitch','Demo')),
  status text not null default 'Not started' check (status in ('Not started','In progress','Ready','Needs work')),
  check_type text not null default 'manual' check (check_type in ('manual','github','deployment','database')),
  evidence_url text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  check (status <> 'Ready' or check_type in ('github','deployment') or evidence_url is not null)
);
create index if not exists criteria_project_order_idx on public.criteria(project_id, sort_order);

create table if not exists public.check_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('passed','partial','failed')),
  summary text not null check (char_length(summary) <= 240),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists check_runs_project_date_idx on public.check_runs(project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.criteria enable row level security;
alter table public.check_runs enable row level security;

drop policy if exists "owners manage projects" on public.projects;
create policy "owners manage projects" on public.projects for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owners manage criteria" on public.criteria;
create policy "owners manage criteria" on public.criteria for all to authenticated
  using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.projects p where p.id = criteria.project_id and p.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.projects p where p.id = criteria.project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "owners manage check runs" on public.check_runs;
create policy "owners manage check runs" on public.check_runs for all to authenticated
  using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.projects p where p.id = check_runs.project_id and p.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.projects p where p.id = check_runs.project_id and p.owner_id = (select auth.uid())
    )
  );

-- Expose only an aggregate count of email-confirmed accounts. No user identities leave auth.users.
create or replace function public.get_verified_signup_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from auth.users where email_confirmed_at is not null;
$$;
revoke all on function public.get_verified_signup_count() from public;
grant execute on function public.get_verified_signup_count() to anon, authenticated;

-- Enable live checklist updates. Safe to re-run if the table is already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'criteria'
  ) then
    alter publication supabase_realtime add table public.criteria;
  end if;
end $$;


grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.criteria to authenticated;
grant select, insert, update, delete on public.check_runs to authenticated;


