-- 若已执行 apply-social-migration.sql，可单独运行本脚本补充胜场列

alter table if exists public.users
  add column if not exists battle_wins int not null default 0;

alter table if exists public.users
  add column if not exists profile_setup_completed boolean not null default false;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'battle_score'
  ) then
    update public.users
    set battle_wins = greatest(battle_wins, coalesce(battle_score, 0))
    where battle_wins = 0 and coalesce(battle_score, 0) > 0;
  end if;
end $$;

do $$
declare
  name_parts text[] := array[]::text[];
  sql text;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'nickname') then
    name_parts := array_append(name_parts, 'nullif(trim(nickname), '''')');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'username') then
    name_parts := array_append(name_parts, 'nullif(trim(username), '''')');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'name') then
    name_parts := array_append(name_parts, 'nullif(trim(name), '''')');
  end if;
  if array_length(name_parts, 1) is null then return; end if;

  sql := format(
    'update public.users set profile_setup_completed = true where profile_setup_completed = false and coalesce(%s, '''') <> ''''',
    array_to_string(name_parts, ', ')
  );
  execute sql;
end $$;
