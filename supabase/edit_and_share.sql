-- Editing deadlines, marking them done, and shared course syllabi.
-- Run this whole file once in Supabase → SQL Editor. Safe to re-run.

-- ---------- Edit + mark done ----------

alter table public.deadlines add column if not exists done boolean not null default false;

grant update on public.deadlines to authenticated;

-- Let people edit their own deadlines. Reuses the exact ownership rule of your existing
-- delete policy (the one "Clear calendar" relies on), so it doesn't guess column names.
do $$
declare
  owner_rule text;
begin
  if exists (select 1 from pg_policies
             where schemaname = 'public' and tablename = 'deadlines' and cmd in ('UPDATE', 'ALL')) then
    return; -- already has an update policy
  end if;
  select qual into owner_rule from pg_policies
  where schemaname = 'public' and tablename = 'deadlines' and cmd = 'DELETE'
  limit 1;
  if owner_rule is null then
    raise exception 'No delete policy found on public.deadlines. Add an update policy by hand (e.g. using (user_id = auth.uid())).';
  end if;
  execute format(
    'create policy "update own deadlines" on public.deadlines for update to authenticated using (%s) with check (%s)',
    owner_rule, owner_rule
  );
end $$;

-- ---------- Shared course syllabi ----------

-- One shared copy per course per uploader. Deadlines are stored as a JSON list of
-- { course, title, date, category, source }. No names or emails are shared.
create table if not exists public.shared_syllabi (
  id bigint generated always as identity primary key,
  course text not null,
  deadlines jsonb not null,
  uploaded_by uuid not null default auth.uid() references auth.users on delete cascade,
  use_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course, uploaded_by)
);
create index if not exists shared_syllabi_course_idx on public.shared_syllabi (course);

alter table public.shared_syllabi enable row level security;

drop policy if exists "anyone logged in can browse" on public.shared_syllabi;
create policy "anyone logged in can browse" on public.shared_syllabi
  for select to authenticated using (true);

drop policy if exists "share your own" on public.shared_syllabi;
create policy "share your own" on public.shared_syllabi
  for insert to authenticated with check (uploaded_by = auth.uid());

drop policy if exists "update your own" on public.shared_syllabi;
create policy "update your own" on public.shared_syllabi
  for update to authenticated using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());

drop policy if exists "remove your own" on public.shared_syllabi;
create policy "remove your own" on public.shared_syllabi
  for delete to authenticated using (uploaded_by = auth.uid());

grant select, insert, update, delete on public.shared_syllabi to authenticated;

-- "Used by N classmates" counter. A function so people can bump it without being able to edit the row.
create or replace function public.use_shared_syllabus(p_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.shared_syllabi set use_count = use_count + 1 where id = p_id;
$$;

revoke execute on function public.use_shared_syllabus(bigint) from public, anon;
grant execute on function public.use_shared_syllabus(bigint) to authenticated;
