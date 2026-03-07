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
  order by profiles.created_at asc;
$$;

revoke all on function public.list_discoverable_people() from public;
grant execute on function public.list_discoverable_people() to authenticated;
