alter table public.profiles
add column if not exists avatar_path text,
add column if not exists skills text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_path_length'
  ) then
    alter table public.profiles
    add constraint profiles_avatar_path_length
    check (avatar_path is null or char_length(avatar_path) <= 256);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_skills_count'
  ) then
    alter table public.profiles
    add constraint profiles_skills_count
    check (coalesce(array_length(skills, 1), 0) <= 16);
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile images are publicly readable" on storage.objects;
create policy "Profile images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'profile-images');

drop policy if exists "Users can upload their own profile image" on storage.objects;
create policy "Users can upload their own profile image"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own profile image" on storage.objects;
create policy "Users can update their own profile image"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own profile image" on storage.objects;
create policy "Users can delete their own profile image"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
