-- ============================================================
-- 补救脚本：daily_tasks 没有 task_type 列时执行
-- （宠物相关迁移若已成功，只需跑本文件即可）
-- ============================================================

-- 1) 补上 task_type 列（没有就创建）
alter table if exists public.daily_tasks
  add column if not exists task_type text;

-- 2) 按任务标题回填类型（与 bootstrap 一致）
update public.daily_tasks set task_type = 'reading' where title = '阅读达人' and (task_type is null or task_type = '');
update public.daily_tasks set task_type = 'question' where title = '知识问答' and (task_type is null or task_type = '');
update public.daily_tasks set task_type = 'challenge' where title = '挑战高手' and (task_type is null or task_type = '');
update public.daily_tasks set task_type = 'pet' where title = '关爱伙伴' and (task_type is null or task_type = '');

-- 3) 按 v2 规则更新未领取任务的金币（仅当存在 coin_reward 列）
do $$
begin
  if exists (
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
