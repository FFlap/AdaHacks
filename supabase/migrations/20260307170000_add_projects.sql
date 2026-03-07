create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  theme text not null default '',
  description text not null default '',
  tech_stack text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_name_length check (char_length(name) <= 80),
  constraint projects_theme_length check (char_length(theme) <= 48),
  constraint projects_description_length check (char_length(description) <= 480)
);

create index if not exists projects_user_id_created_at_idx
on public.projects (user_id, created_at);

alter table public.projects enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_tech_stack_count'
  ) then
    alter table public.projects
    add constraint projects_tech_stack_count
    check (coalesce(array_length(tech_stack, 1), 0) <= 16);
  end if;
end
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute procedure public.touch_profile_updated_at();

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
on public.projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own projects" on public.projects;
create policy "Users can read their own projects"
on public.projects
for select
using (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
on public.projects
for delete
using (auth.uid() = user_id);
