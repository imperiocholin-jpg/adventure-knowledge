-- 一键修复 pets / daily_tasks 的 RLS 归属列策略
-- Supabase Dashboard → SQL Editor → 粘贴全文 → Run
-- （内容与 migrations/20260530150000_fix_pets_rls_owner_column.sql 相同）

do $$
declare
  pets_owner_col text;
  tasks_owner_col text;
begin
  select column_name
  into pets_owner_col
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'pets'
    and column_name in ('user_id', 'uid', 'owner_id', 'auth_user_id')
  order by case column_name
    when 'user_id' then 1
    when 'uid' then 2
    when 'owner_id' then 3
    when 'auth_user_id' then 4
  end
  limit 1;

  if pets_owner_col is not null then
    execute 'drop policy if exists pets_select_own on public.pets';
    execute format(
      'create policy pets_select_own on public.pets for select to authenticated using (auth.uid() = %I)',
      pets_owner_col
    );
    execute 'drop policy if exists pets_insert_own on public.pets';
    execute format(
      'create policy pets_insert_own on public.pets for insert to authenticated with check (auth.uid() = %I)',
      pets_owner_col
    );
    execute 'drop policy if exists pets_update_own on public.pets';
    execute format(
      'create policy pets_update_own on public.pets for update to authenticated using (auth.uid() = %I) with check (auth.uid() = %I)',
      pets_owner_col,
      pets_owner_col
    );
  end if;

  select column_name
  into tasks_owner_col
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'daily_tasks'
    and column_name in ('user_id', 'uid', 'owner_id', 'auth_user_id')
  order by case column_name
    when 'user_id' then 1
    when 'uid' then 2
    when 'owner_id' then 3
    when 'auth_user_id' then 4
  end
  limit 1;

  if tasks_owner_col is not null then
    execute 'drop policy if exists daily_tasks_select_own on public.daily_tasks';
    execute format(
      'create policy daily_tasks_select_own on public.daily_tasks for select to authenticated using (auth.uid() = %I)',
      tasks_owner_col
    );
    execute 'drop policy if exists daily_tasks_insert_own on public.daily_tasks';
    execute format(
      'create policy daily_tasks_insert_own on public.daily_tasks for insert to authenticated with check (auth.uid() = %I)',
      tasks_owner_col
    );
    execute 'drop policy if exists daily_tasks_update_own on public.daily_tasks';
    execute format(
      'create policy daily_tasks_update_own on public.daily_tasks for update to authenticated using (auth.uid() = %I) with check (auth.uid() = %I)',
      tasks_owner_col,
      tasks_owner_col
    );
  end if;
end $$;
