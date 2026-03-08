create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid not null references auth.users (id) on delete cascade,
  initiated_by_user_id uuid not null references auth.users (id) on delete cascade,
  source_swipe_id uuid not null references public.swipes (id) on delete cascade,
  source_target_type text not null,
  source_target_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz not null default timezone('utc', now()),
  constraint chat_threads_source_target_type_check check (source_target_type in ('profile', 'project')),
  constraint chat_threads_distinct_users_check check (user_a_id <> user_b_id),
  constraint chat_threads_sorted_users_check check (user_a_id::text < user_b_id::text)
);

create unique index if not exists chat_threads_user_pair_idx
on public.chat_threads (user_a_id, user_b_id);

create index if not exists chat_threads_last_message_at_idx
on public.chat_threads (last_message_at desc, created_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chat_messages_body_check check (char_length(btrim(body)) between 1 and 2000)
);

create index if not exists chat_messages_thread_created_at_idx
on public.chat_messages (thread_id, created_at asc);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Participants can read chat threads" on public.chat_threads;
create policy "Participants can read chat threads"
on public.chat_threads
for select
using (auth.uid() in (user_a_id, user_b_id));

drop policy if exists "Recipients can start chat threads" on public.chat_threads;
create policy "Recipients can start chat threads"
on public.chat_threads
for insert
with check (
  auth.uid() = initiated_by_user_id
  and auth.uid() in (user_a_id, user_b_id)
);

drop policy if exists "Participants can update chat threads" on public.chat_threads;
create policy "Participants can update chat threads"
on public.chat_threads
for update
using (auth.uid() in (user_a_id, user_b_id))
with check (auth.uid() in (user_a_id, user_b_id));

drop policy if exists "Participants can read chat messages" on public.chat_messages;
create policy "Participants can read chat messages"
on public.chat_messages
for select
using (
  exists (
    select 1
    from public.chat_threads
    where chat_threads.id = chat_messages.thread_id
      and auth.uid() in (chat_threads.user_a_id, chat_threads.user_b_id)
  )
);

drop policy if exists "Participants can send chat messages" on public.chat_messages;
create policy "Participants can send chat messages"
on public.chat_messages
for insert
with check (
  auth.uid() = sender_user_id
  and exists (
    select 1
    from public.chat_threads
    where chat_threads.id = chat_messages.thread_id
      and auth.uid() in (chat_threads.user_a_id, chat_threads.user_b_id)
  )
);

create or replace function public.touch_chat_thread_from_message()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.chat_threads
  set
    updated_at = new.created_at,
    last_message_at = new.created_at
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
after insert on public.chat_messages
for each row
execute function public.touch_chat_thread_from_message();

create or replace function public.list_chat_threads()
returns table (
  id uuid,
  counterpart_id uuid,
  counterpart_full_name text,
  counterpart_email text,
  counterpart_avatar_path text,
  initiated_by_user_id uuid,
  source_notification_id uuid,
  source_target_type text,
  source_target_id uuid,
  source_target_name text,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  latest_message_preview text,
  latest_message_sender_id uuid
)
language sql
security definer
set search_path = public, auth
as $$
  select
    chat_threads.id,
    counterpart.id as counterpart_id,
    counterpart.full_name as counterpart_full_name,
    counterpart_user.email as counterpart_email,
    counterpart.avatar_path as counterpart_avatar_path,
    chat_threads.initiated_by_user_id,
    chat_threads.source_swipe_id as source_notification_id,
    chat_threads.source_target_type,
    chat_threads.source_target_id,
    case
      when chat_threads.source_target_type = 'project' then source_project.name
      else null
    end as source_target_name,
    chat_threads.created_at,
    chat_threads.updated_at,
    chat_threads.last_message_at,
    latest_message.body as latest_message_preview,
    latest_message.sender_user_id as latest_message_sender_id
  from public.chat_threads
  inner join public.profiles as counterpart on counterpart.id = case
    when chat_threads.user_a_id = auth.uid() then chat_threads.user_b_id
    else chat_threads.user_a_id
  end
  inner join auth.users as counterpart_user on counterpart_user.id = counterpart.id
  left join public.projects as source_project
    on chat_threads.source_target_type = 'project'
    and source_project.id = chat_threads.source_target_id
  left join lateral (
    select
      chat_messages.body,
      chat_messages.sender_user_id
    from public.chat_messages
    where chat_messages.thread_id = chat_threads.id
    order by chat_messages.created_at desc
    limit 1
  ) as latest_message on true
  where auth.uid() in (chat_threads.user_a_id, chat_threads.user_b_id)
  order by chat_threads.last_message_at desc, chat_threads.created_at desc;
$$;

revoke all on function public.list_chat_threads() from public;
grant execute on function public.list_chat_threads() to authenticated;

create or replace function public.list_chat_messages(p_thread_id uuid)
returns table (
  id uuid,
  thread_id uuid,
  sender_user_id uuid,
  body text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select
    chat_messages.id,
    chat_messages.thread_id,
    chat_messages.sender_user_id,
    chat_messages.body,
    chat_messages.created_at
  from public.chat_messages
  where chat_messages.thread_id = p_thread_id
    and exists (
      select 1
      from public.chat_threads
      where chat_threads.id = p_thread_id
        and auth.uid() in (chat_threads.user_a_id, chat_threads.user_b_id)
    )
  order by chat_messages.created_at asc;
$$;

revoke all on function public.list_chat_messages(uuid) from public;
grant execute on function public.list_chat_messages(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end
$$;
