-- ============================================================
-- 冒险知识 v2 · 一次性迁移（粘贴到 Supabase SQL Editor 执行）
-- ============================================================

-- 背包与基础字段
alter table if exists public.pets
  add column if not exists pet_inventory jsonb not null default '{}'::jsonb,
  add column if not exists hunger integer not null default 80,
  add column if not exists pet_exp integer not null default 0,
  add column if not exists is_dead boolean not null default false,
  add column if not exists dead_at timestamptz null;

alter table if exists public.pets alter column hunger set default 80;

alter table if exists public.pets
  add column if not exists spirit integer not null default 80,
  add column if not exists bond integer not null default 80,
  add column if not exists last_daily_decay_date date null,
  add column if not exists pet_level integer not null default 1,
  add column if not exists life_stage text not null default '幼崽';

comment on column public.pets.hunger is '饱食度 0-100，0 为死亡';
comment on column public.pets.spirit is '精神值 0-100';
comment on column public.pets.bond is '亲密值 0-100';
comment on column public.pets.pet_exp is '宠物累计经验（方案 A）';
comment on column public.pets.pet_level is '宠物等级 1-50';
comment on column public.pets.life_stage is '幼崽 | 成年 | 壮年';

-- 等级函数（方案 A）
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
  life_stage = public.pet_life_stage_from_level(public.pet_level_from_exp(coalesce(pet_exp, 0)::bigint));

-- 每日任务金币（先确保 task_type 列存在）
alter table if exists public.daily_tasks add column if not exists task_type text;

update public.daily_tasks set task_type = 'reading' where title = '阅读达人' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'question' where title = '知识问答' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'challenge' where title = '挑战高手' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'pet' where title = '关爱伙伴' and coalesce(task_type, '') = '';

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'daily_tasks'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_tasks' and column_name = 'coin_reward'
  ) then
    update public.daily_tasks set coin_reward = 25
    where lower(coalesce(task_type, '')) in ('reading', 'read', 'question', 'quiz')
      and coalesce(claimed, false) = false;

    update public.daily_tasks set coin_reward = 35
    where lower(coalesce(task_type, '')) in ('challenge', 'pk', 'battle')
      and coalesce(claimed, false) = false;

    update public.daily_tasks set coin_reward = 15
    where lower(coalesce(task_type, '')) in ('pet', 'feed', 'care')
      and coalesce(claimed, false) = false;
  end if;
end $$;

-- 连续活跃天数（users）
alter table if exists public.users
  add column if not exists daily_streak integer not null default 0,
  add column if not exists last_active_date date null;

-- 神秘宝藏：请在 SQL Editor 另执行 migrations/20260530200000_treasures.sql（含 seed）
