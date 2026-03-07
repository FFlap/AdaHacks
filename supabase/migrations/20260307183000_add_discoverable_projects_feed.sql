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
  order by projects.created_at asc;
$$;

revoke all on function public.list_discoverable_projects() from public;
grant execute on function public.list_discoverable_projects() to authenticated;
