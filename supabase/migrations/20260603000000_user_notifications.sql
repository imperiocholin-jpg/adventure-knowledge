-- 用户消息通知

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  category text not null check (category in ('adventure', 'library', 'pet', 'system')),
  rule_key text not null,
  dedupe_key text,
  title text not null,
  body text not null,
  href text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists user_notifications_user_dedupe_idx
  on public.user_notifications (user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications (user_id)
  where read_at is null;

alter table public.user_notifications enable row level security;

drop policy if exists user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own on public.user_notifications
  for select using (
    user_id = auth.uid()::text
    or user_id in (select id::text from public.users where id = auth.uid())
  );

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own on public.user_notifications
  for update using (
    user_id = auth.uid()::text
    or user_id in (select id::text from public.users where id = auth.uid())
  );
