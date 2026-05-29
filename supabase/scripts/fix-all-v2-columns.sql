-- ============================================================
-- 一次性补全 v2 所需全部列（根据你当前库的状态执行本文件即可）
-- 在 Supabase SQL Editor：New query → 全选粘贴 → Run
-- 成功应显示 Success，无红色 ERROR
-- ============================================================

-- ---------- 一、pets 表：补列 + 注释 ----------
alter table if exists public.pets
  add column if not exists pet_inventory jsonb not null default '{}'::jsonb,
  add column if not exists hunger integer not null default 80,
  add column if not exists spirit integer not null default 80,
  add column if not exists bond integer not null default 80,
  add column if not exists pet_exp integer not null default 0,
  add column if not exists pet_level integer not null default 1,
  add column if not exists life_stage text not null default '幼崽',
  add column if not exists is_dead boolean not null default false,
  add column if not exists dead_at timestamptz null,
  add column if not exists last_daily_decay_date date null;

alter table if exists public.pets alter column hunger set default 80;

comment on column public.pets.hunger is '饱食度 0-100，0 为死亡';
comment on column public.pets.spirit is '精神值 0-100';
comment on column public.pets.bond is '亲密值 0-100';

-- ---------- 二、等级函数（方案 A）----------
create or replace function public.pet_level_from_exp(p_exp bigint)
returns integer language plpgsql immutable as $$
declare
  lvl integer := 1; cap integer := 50; cum bigint := 0; need integer; exp_val bigint;
begin
  exp_val := greatest(0, coalesce(p_exp, 0));
  while lvl < cap loop
    need := 80 + (lvl - 1) * 8;
    if exp_val < cum + need then return lvl; end if;
    cum := cum + need; lvl := lvl + 1;
  end loop;
  return cap;
end; $$;

create or replace function public.pet_life_stage_from_level(p_level integer)
returns text language sql immutable as $$
  select case
    when greatest(1, least(50, coalesce(p_level, 1))) >= 26 then '壮年'
    when greatest(1, least(50, coalesce(p_level, 1))) >= 11 then '成年'
    else '幼崽' end;
$$;

update public.pets
set
  pet_level = public.pet_level_from_exp(coalesce(pet_exp, 0)::bigint),
  life_stage = public.pet_life_stage_from_level(
    public.pet_level_from_exp(coalesce(pet_exp, 0)::bigint)
  );

-- ---------- 三、daily_tasks 表：补列 ----------
alter table if exists public.daily_tasks
  add column if not exists task_type text,
  add column if not exists xp_reward integer not null default 0,
  add column if not exists coin_reward integer not null default 0,
  add column if not exists pet_reward integer not null default 0,
  add column if not exists progress integer not null default 0,
  add column if not exists max_progress integer not null default 1,
  add column if not exists status text not null default 'incomplete',
  add column if not exists claimed boolean not null default false,
  add column if not exists completed boolean not null default false;

-- 按标题回填 task_type
update public.daily_tasks set task_type = 'reading' where title = '阅读达人' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'question' where title = '知识问答' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'challenge' where title = '挑战高手' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'pet' where title = '关爱伙伴' and coalesce(task_type, '') = '';

-- v2 金币档位（未领取）
update public.daily_tasks set coin_reward = 25
where lower(coalesce(task_type, '')) in ('reading', 'read', 'question', 'quiz')
  and coalesce(claimed, false) = false;

update public.daily_tasks set coin_reward = 35
where lower(coalesce(task_type, '')) in ('challenge', 'pk', 'battle')
  and coalesce(claimed, false) = false;

update public.daily_tasks set coin_reward = 15
where lower(coalesce(task_type, '')) in ('pet', 'feed', 'care')
  and coalesce(claimed, false) = false;

-- ---------- 四、users 表：coins + 连续活跃天数 ----------
alter table if exists public.users
  add column if not exists coins integer not null default 0,
  add column if not exists daily_streak integer not null default 0,
  add column if not exists last_active_date date null;

comment on column public.users.daily_streak is '连续活跃自然日计数';
comment on column public.users.last_active_date is '最近一次计为活跃的自然日（UTC 日期）';

-- ---------- 五、神秘宝藏（定义 + 用户解锁）----------
-- 完整 seed 见 migrations/20260530200000_treasures.sql；此处仅建表
create table if not exists public.treasure_definitions (
  id text primary key,
  name text not null,
  icon text not null default '🎁',
  reward_type text not null,
  rarity text not null,
  description text not null default '',
  requirement_label text not null,
  condition_type text not null,
  target_value integer not null default 1,
  condition_payload jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_treasures (
  user_id text not null,
  treasure_id text not null references public.treasure_definitions (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, treasure_id)
);

-- ---------- 六、运营后台：admin 角色 + 审计 ----------
alter table if exists public.users
  add column if not exists role text not null default 'user';

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- 七、用户资料扩展（学校/班级/年龄/邮箱）----------
alter table if exists public.users
  add column if not exists email text null,
  add column if not exists school_name text null,
  add column if not exists grade_class text null,
  add column if not exists age integer null;

-- ---------- 八、好友关注 + 对战胜场 ----------
alter table if exists public.users
  add column if not exists battle_score int not null default 0;

alter table if exists public.users
  add column if not exists battle_score_date date;

alter table if exists public.users
  add column if not exists battle_wins int not null default 0;

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
