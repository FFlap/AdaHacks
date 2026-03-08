alter table public.profiles
add column if not exists contact_links jsonb not null default '{}'::jsonb;

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  decision text not null,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz,
  constraint swipes_target_type_check check (target_type in ('profile', 'project')),
  constraint swipes_decision_check check (decision in ('pass', 'like')),
  constraint swipes_no_self_swipe check (actor_user_id <> target_user_id)
);

create unique index if not exists swipes_actor_target_idx
on public.swipes (actor_user_id, target_type, target_id);

create index if not exists swipes_target_user_created_at_idx
on public.swipes (target_user_id, created_at desc);

alter table public.swipes enable row level security;

drop policy if exists "Users can insert their own swipes" on public.swipes;
create policy "Users can insert their own swipes"
on public.swipes
for insert
with check (auth.uid() = actor_user_id);

drop policy if exists "Users can update notifications sent to them" on public.swipes;
create policy "Users can update notifications sent to them"
on public.swipes
for update
using (auth.uid() = target_user_id)
with check (auth.uid() = target_user_id);

drop policy if exists "Users can read related swipes" on public.swipes;
create policy "Users can read related swipes"
on public.swipes
for select
using (
  auth.uid() = actor_user_id
  or auth.uid() = target_user_id
);

create or replace function public.list_discoverable_projects()
returns table (
  id uuid,
  name text,
  theme text,
  description text,
  tech_stack text[],
  owner_id uuid,
  owner_full_name text,
  owner_avatar_path text,
  owner_email text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    projects.id,
    projects.name,
    projects.theme,
    projects.description,
    projects.tech_stack,
    profiles.id as owner_id,
    profiles.full_name as owner_full_name,
    profiles.avatar_path as owner_avatar_path,
    users.email as owner_email
  from public.projects
  inner join public.profiles on profiles.id = projects.user_id
  inner join auth.users as users on users.id = projects.user_id
  where projects.user_id <> auth.uid()
    and not exists (
      select 1
      from public.swipes
      where swipes.actor_user_id = auth.uid()
        and swipes.target_type = 'project'
        and swipes.target_id = projects.id
    )
  order by projects.created_at asc;
$$;

revoke all on function public.list_discoverable_projects() from public;
grant execute on function public.list_discoverable_projects() to authenticated;

create or replace function public.list_discoverable_people()
returns table (
  id uuid,
  full_name text,
  avatar_path text,
  bio text,
  skills text[],
  created_at timestamptz,
  email text,
  projects jsonb
)
language sql
security definer
set search_path = public, auth
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_path,
    profiles.bio,
    profiles.skills,
    profiles.created_at,
    users.email,
    coalesce(projects_summary.projects, '[]'::jsonb) as projects
  from public.profiles
  inner join auth.users as users on users.id = profiles.id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', projects.id,
        'name', projects.name,
        'theme', projects.theme
      )
      order by projects.created_at asc
    ) as projects
    from public.projects
    where projects.user_id = profiles.id
  ) as projects_summary on true
  where profiles.id <> auth.uid()
    and not exists (
      select 1
      from public.swipes
      where swipes.actor_user_id = auth.uid()
        and swipes.target_type = 'profile'
        and swipes.target_id = profiles.id
    )
  order by profiles.created_at asc;
$$;

revoke all on function public.list_discoverable_people() from public;
grant execute on function public.list_discoverable_people() to authenticated;

create or replace function public.list_notifications()
returns table (
  id uuid,
  decision text,
  target_type text,
  target_id uuid,
  target_name text,
  created_at timestamptz,
  read_at timestamptz,
  actor_id uuid,
  actor_full_name text,
  actor_email text,
  actor_avatar_path text,
  actor_bio text,
  actor_skills text[],
  actor_contact_links jsonb,
  actor_projects jsonb
)
language sql
security definer
set search_path = public, auth
as $$
  select
    swipes.id,
    swipes.decision,
    swipes.target_type,
    swipes.target_id,
    case
      when swipes.target_type = 'project' then projects.name
      else null
    end as target_name,
    swipes.created_at,
    swipes.read_at,
    actor_profiles.id as actor_id,
    actor_profiles.full_name as actor_full_name,
    users.email as actor_email,
    actor_profiles.avatar_path as actor_avatar_path,
    actor_profiles.bio as actor_bio,
    actor_profiles.skills as actor_skills,
    actor_profiles.contact_links as actor_contact_links,
    coalesce(actor_projects.projects, '[]'::jsonb) as actor_projects
  from public.swipes
  inner join public.profiles as actor_profiles on actor_profiles.id = swipes.actor_user_id
  inner join auth.users as users on users.id = actor_profiles.id
  left join public.projects on swipes.target_type = 'project' and projects.id = swipes.target_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', projects.id,
        'name', projects.name,
        'theme', projects.theme,
        'description', projects.description,
        'techStack', projects.tech_stack
      )
      order by projects.created_at asc
    ) as projects
    from public.projects
    where projects.user_id = actor_profiles.id
  ) as actor_projects on true
  where swipes.target_user_id = auth.uid()
  order by swipes.created_at desc;
$$;

revoke all on function public.list_notifications() from public;
grant execute on function public.list_notifications() to authenticated;
