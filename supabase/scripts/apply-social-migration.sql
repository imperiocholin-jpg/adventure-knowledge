-- Supabase SQL Editor 一键：好友 + 排行榜积分
-- 与 migrations/20260530160000_user_follows_and_battle_score.sql 相同

alter table if exists public.users
  add column if not exists battle_score int not null default 0;

alter table if exists public.users
  add column if not exists battle_score_date date;

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follows_no_self check (follower_id <> following_id),
  constraint user_follows_unique unique (follower_id, following_id)
);

create index if not exists user_follows_follower_idx on public.user_follows (follower_id);
create index if not exists user_follows_following_idx on public.user_follows (following_id);

alter table public.user_follows enable row level security;

drop policy if exists user_follows_select_own on public.user_follows;
create policy user_follows_select_own
on public.user_follows for select to authenticated
using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists user_follows_insert_own on public.user_follows;
create policy user_follows_insert_own
on public.user_follows for insert to authenticated
with check (auth.uid() = follower_id);

drop policy if exists user_follows_delete_own on public.user_follows;
create policy user_follows_delete_own
on public.user_follows for delete to authenticated
using (auth.uid() = follower_id);

-- 胜场排行 + 注册资料完成标记（若已执行过可单独跑 apply-battle-wins-migration.sql）
alter table if exists public.users
  add column if not exists battle_wins int not null default 0;

alter table if exists public.users
  add column if not exists profile_setup_completed boolean not null default false;
