-- 排行榜改为累计胜场；注册资料完成标记

alter table if exists public.users
  add column if not exists battle_wins int not null default 0;

alter table if exists public.users
  add column if not exists profile_setup_completed boolean not null default false;

comment on column public.users.battle_wins is '宠物对战历史累计胜场（排行榜）';
comment on column public.users.profile_setup_completed is '是否完成注册：昵称+头像';

-- 若曾用 battle_score，尽量迁移为胜场基数（可选）
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

-- 老用户已有昵称的视为已完成资料设置
update public.users
set profile_setup_completed = true
where profile_setup_completed = false
  and coalesce(nullif(trim(nickname), ''), nullif(trim(username), ''), '') <> '';
