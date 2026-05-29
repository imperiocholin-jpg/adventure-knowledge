-- 方案 A 等级函数 + 按 pet_exp 重算等级/阶段 + 每日任务 coins 档位对齐

create or replace function public.pet_level_from_exp(p_exp bigint)
returns integer
language plpgsql
immutable
as $$
declare
  lvl integer := 1;
  cap integer := 50;
  cum bigint := 0;
  need integer;
  exp_val bigint;
begin
  exp_val := greatest(0, coalesce(p_exp, 0));
  while lvl < cap loop
    need := 80 + (lvl - 1) * 8;
    if exp_val < cum + need then
      return lvl;
    end if;
    cum := cum + need;
    lvl := lvl + 1;
  end loop;
  return cap;
end;
$$;

create or replace function public.pet_life_stage_from_level(p_level integer)
returns text
language sql
immutable
as $$
  select case
    when greatest(1, least(50, coalesce(p_level, 1))) >= 26 then '壮年'
    when greatest(1, least(50, coalesce(p_level, 1))) >= 11 then '成年'
    else '幼崽'
  end;
$$;

comment on function public.pet_level_from_exp is '宠物累计经验 → 等级（方案 A：80+(L-1)*8/级，封顶50）';
comment on function public.pet_life_stage_from_level is '等级 → 生命阶段（1-10幼崽/11-25成年/26-50壮年）';

-- 重算 pets 等级与 life_stage（兼容 pet_level/level、pet_exp/exp）
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_exp'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_level'
    ) then
      execute $sql$
        update public.pets
        set
          pet_level = public.pet_level_from_exp(coalesce(pet_exp, 0)::bigint),
          life_stage = public.pet_life_stage_from_level(
            public.pet_level_from_exp(coalesce(pet_exp, 0)::bigint)
          )
        where pet_exp is not null
      $sql$;
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'exp'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'level'
  ) then
    execute $sql$
      update public.pets
      set
        level = public.pet_level_from_exp(coalesce(exp, 0)::bigint),
        life_stage = coalesce(life_stage, public.pet_life_stage_from_level(
          public.pet_level_from_exp(coalesce(exp, 0)::bigint)
        ))
      where exp is not null
    $sql$;
  end if;
end $$;

-- 每日任务 coins 档位
alter table if exists public.daily_tasks add column if not exists task_type text;

update public.daily_tasks set task_type = 'reading' where title = '阅读达人' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'question' where title = '知识问答' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'challenge' where title = '挑战高手' and coalesce(task_type, '') = '';
update public.daily_tasks set task_type = 'pet' where title = '关爱伙伴' and coalesce(task_type, '') = '';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_tasks' and column_name = 'coin_reward'
  ) then
    update public.daily_tasks set coin_reward = 25
    where lower(coalesce(task_type, '')) in ('reading', 'read', 'question', 'quiz')
      and coalesce(claimed, false) = false
      and coalesce(status, 'incomplete') not in ('claimed', 'done');

    update public.daily_tasks set coin_reward = 35
    where lower(coalesce(task_type, '')) in ('challenge', 'pk', 'battle')
      and coalesce(claimed, false) = false
      and coalesce(status, 'incomplete') not in ('claimed', 'done');

    update public.daily_tasks set coin_reward = 15
    where lower(coalesce(task_type, '')) in ('pet', 'feed', 'care')
      and coalesce(claimed, false) = false
      and coalesce(status, 'incomplete') not in ('claimed', 'done');
  end if;
end $$;
