-- Study buddy: match two students in the same course, then let them chat.
-- Run this whole file once in Supabase → SQL Editor. Safe to re-run.

-- People waiting for a buddy (one row per person per course)
create table if not exists public.study_requests (
  user_id uuid not null references auth.users on delete cascade,
  course text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course)
);

-- A pair of students. Names/avatars are copied in at match time,
-- because nobody can read other people's rows in auth.users.
create table if not exists public.study_matches (
  id bigint generated always as identity primary key,
  course text not null,
  user_a uuid not null references auth.users on delete cascade,
  user_b uuid not null references auth.users on delete cascade,
  user_a_name text not null,
  user_b_name text not null,
  user_a_avatar text,
  user_b_avatar text,
  ended_at timestamptz, -- set when either person unmatches
  created_at timestamptz not null default now()
);

create table if not exists public.study_messages (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.study_matches on delete cascade,
  sender uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists study_messages_match_idx on public.study_messages (match_id, created_at);

-- Row Level Security: you only ever see your own requests, matches and chats
alter table public.study_requests enable row level security;
alter table public.study_matches enable row level security;
alter table public.study_messages enable row level security;

drop policy if exists "see own requests" on public.study_requests;
create policy "see own requests" on public.study_requests
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cancel own requests" on public.study_requests;
create policy "cancel own requests" on public.study_requests
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "see own matches" on public.study_matches;
create policy "see own matches" on public.study_matches
  for select to authenticated using (auth.uid() in (user_a, user_b));

drop policy if exists "read own chats" on public.study_messages;
create policy "read own chats" on public.study_messages
  for select to authenticated using (
    exists (select 1 from public.study_matches m
            where m.id = match_id and auth.uid() in (m.user_a, m.user_b))
  );

drop policy if exists "send in own active chats" on public.study_messages;
create policy "send in own active chats" on public.study_messages
  for insert to authenticated with check (
    sender = auth.uid()
    and exists (select 1 from public.study_matches m
                where m.id = match_id and m.ended_at is null and auth.uid() in (m.user_a, m.user_b))
  );

-- Table access for logged-in users (newer Supabase projects don't grant this by default).
-- RLS above still limits which rows they can touch.
grant select, delete on public.study_requests to authenticated;
grant select on public.study_matches to authenticated;
grant select, insert on public.study_messages to authenticated;

-- Requests and matches are only created/ended through the functions below
-- (no insert/update policies), so nobody can fake a match with someone.

-- "Find study buddy" button. Returns the new match, or null if you're now waiting.
create or replace function public.find_study_buddy(p_course text)
returns public.study_matches
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  c text := upper(regexp_replace(trim(p_course), '\s+', ' ', 'g'));
  other uuid;
  m public.study_matches;
begin
  if me is null then
    raise exception 'Please log in first.';
  end if;
  if c = '' then
    raise exception 'Pick a course first.';
  end if;

  -- One matcher per course at a time, so two people clicking together can't both miss each other
  perform pg_advisory_xact_lock(hashtext('study_buddy:' || c));

  -- Already have an active buddy in this course? Hand that back
  select * into m from public.study_matches
  where course = c and ended_at is null and me in (user_a, user_b)
  limit 1;
  if found then
    return m;
  end if;

  -- Longest-waiting person in the course, skipping anyone you've unmatched with before
  select r.user_id into other
  from public.study_requests r
  where r.course = c
    and r.user_id <> me
    and not exists (
      select 1 from public.study_matches old
      where old.course = c
        and ((old.user_a = me and old.user_b = r.user_id) or (old.user_a = r.user_id and old.user_b = me))
    )
  order by r.created_at
  limit 1;

  if other is null then
    insert into public.study_requests (user_id, course) values (me, c)
    on conflict do nothing;
    return null;
  end if;

  delete from public.study_requests where course = c and user_id in (me, other);

  insert into public.study_matches (course, user_a, user_b, user_a_name, user_b_name, user_a_avatar, user_b_avatar)
  select c, a.id, b.id,
    coalesce(a.raw_user_meta_data ->> 'full_name', a.raw_user_meta_data ->> 'name', split_part(a.email, '@', 1)),
    coalesce(b.raw_user_meta_data ->> 'full_name', b.raw_user_meta_data ->> 'name', split_part(b.email, '@', 1)),
    coalesce(a.raw_user_meta_data ->> 'avatar_url', a.raw_user_meta_data ->> 'picture'),
    coalesce(b.raw_user_meta_data ->> 'avatar_url', b.raw_user_meta_data ->> 'picture')
  from auth.users a, auth.users b
  where a.id = me and b.id = other
  returning * into m;

  return m;
end;
$$;

-- "Unmatch" button. Ends the chat for both people; they won't be matched again in that course.
create or replace function public.end_study_match(p_match_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.study_matches
  set ended_at = now()
  where id = p_match_id and ended_at is null and auth.uid() in (user_a, user_b);
$$;

revoke execute on function public.find_study_buddy(text) from public, anon;
revoke execute on function public.end_study_match(bigint) from public, anon;
grant execute on function public.find_study_buddy(text) to authenticated;
grant execute on function public.end_study_match(bigint) to authenticated;

-- Live updates: new matches and messages show up without refreshing
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'study_matches') then
    alter publication supabase_realtime add table public.study_matches;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'study_messages') then
    alter publication supabase_realtime add table public.study_messages;
  end if;
end $$;
