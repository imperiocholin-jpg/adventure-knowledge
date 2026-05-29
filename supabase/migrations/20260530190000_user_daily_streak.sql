-- 用户连续活跃天数（首页「连续 N 天」）
alter table if exists public.users
  add column if not exists daily_streak integer not null default 0,
  add column if not exists last_active_date date null;

comment on column public.users.daily_streak is '连续活跃自然日计数';
comment on column public.users.last_active_date is '最近一次计为活跃的自然日（UTC 日期）';
