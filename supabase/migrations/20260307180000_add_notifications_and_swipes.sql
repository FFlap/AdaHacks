-- Create swipes table to track all swipe interactions
create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiped_by_user_id uuid not null references auth.users (id) on delete cascade,
  swiped_on_user_id uuid not null references auth.users (id) on delete cascade,
  profile_type text not null default 'profile',
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint swipes_different_users check (swiped_by_user_id != swiped_on_user_id)
);

create index if not exists swipes_swiped_by_user_id_idx
on public.swipes (swiped_by_user_id);

create index if not exists swipes_swiped_on_user_id_idx
on public.swipes (swiped_on_user_id);

create index if not exists swipes_created_at_idx
on public.swipes (created_at);

alter table public.swipes enable row level security;

drop policy if exists "Users can insert their own swipes" on public.swipes;
create policy "Users can insert their own swipes"
on public.swipes
for insert
with check (auth.uid() = swiped_by_user_id);

drop policy if exists "Users can read swipes on their profile" on public.swipes;
create policy "Users can read swipes on their profile"
on public.swipes
for select
using (auth.uid() = swiped_on_user_id);

-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  triggered_by_user_id uuid not null references auth.users (id) on delete cascade,
  notification_type text not null check (notification_type in ('profile_liked', 'project_liked')),
  related_swipe_id uuid references public.swipes (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create index if not exists notifications_user_id_idx
on public.notifications (user_id);

create index if not exists notifications_user_id_created_at_idx
on public.notifications (user_id, created_at desc);

create index if not exists notifications_is_read_idx
on public.notifications (user_id, is_read);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
on public.notifications
for update
using (auth.uid() = user_id);

-- Function to create a notification when someone swipes right on a profile
create or replace function public.create_profile_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_notification uuid;
begin
  -- Only create notifications for right swipes
  if new.direction != 'right' then
    return new;
  end if;

  -- Check if we already have an unread notification for this combination
  select id into existing_notification
  from public.notifications
  where user_id = new.swiped_on_user_id
    and triggered_by_user_id = new.swiped_by_user_id
    and notification_type = 'profile_liked'
    and is_read = false
  limit 1;

  -- If no unread notification exists, create one
  if existing_notification is null then
    insert into public.notifications (
      user_id,
      triggered_by_user_id,
      notification_type,
      related_swipe_id
    ) values (
      new.swiped_on_user_id,
      new.swiped_by_user_id,
      'profile_liked',
      new.id
    );
  else
    -- Update the existing notification's timestamp
    update public.notifications
    set created_at = timezone('utc', now()),
        related_swipe_id = new.id
    where id = existing_notification;
  end if;

  return new;
end;
$$;

drop trigger if exists swipes_create_notification on public.swipes;
create trigger swipes_create_notification
after insert on public.swipes
for each row execute procedure public.create_profile_like_notification();
