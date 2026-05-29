-- ============================================================
-- v2 部署自检（整份 Run 一次即可，看一张汇总表）
-- 在 Supabase SQL Editor 粘贴本文件 → Run
-- ============================================================

-- 【检查 A】pets 表是否有所需列（应有 9 行，check = pets_column）
select
  'pets_column' as check_group,
  column_name as detail,
  'OK' as status
from information_schema.columns
where table_schema = 'public'
  and table_name = 'pets'
  and column_name in (
    'hunger', 'spirit', 'bond', 'pet_exp', 'pet_level',
    'life_stage', 'last_daily_decay_date', 'is_dead', 'pet_inventory'
  )

union all

-- 【检查 B】daily_tasks 表是否有所需列（应有 6 行，check = tasks_column）
select
  'tasks_column' as check_group,
  column_name as detail,
  'OK' as status
from information_schema.columns
where table_schema = 'public'
  and table_name = 'daily_tasks'
  and column_name in ('title', 'task_type', 'coin_reward', 'claimed', 'xp_reward', 'pet_reward')

union all

-- 【检查 C】pets 缺哪些列（若 detail 有内容 = 还缺，需再跑 fix-all-v2-columns.sql）
select
  'pets_MISSING' as check_group,
  missing.col as detail,
  '需要补列' as status
from (
  select unnest(array[
    'hunger', 'spirit', 'bond', 'pet_exp', 'pet_level',
    'life_stage', 'last_daily_decay_date', 'is_dead', 'pet_inventory'
  ]) as col
) missing
where not exists (
  select 1
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'pets'
    and c.column_name = missing.col
)

order by check_group, detail;

-- ============================================================
-- 如何判断结果？
-- pets_column  应有 9 行 → pets 表结构 OK
-- tasks_column 应有 6 行 → daily_tasks 表结构 OK
-- pets_MISSING 应为 0 行 → 无缺失；若有行 = 请执行 fix-all-v2-columns.sql
--
-- 下面两段请【单独选中后 Run】查看具体数据（整份 Run 不会显示它们的结果）：
-- ============================================================

-- 【可选】宠物数据样例（单独选中本段 → Run）
-- select pet_exp, pet_level, life_stage, hunger, spirit, bond, is_dead
-- from public.pets limit 3;

-- 【可选】任务金币（单独选中本段 → Run）
-- select title, task_type, coin_reward, claimed
-- from public.daily_tasks limit 10;
