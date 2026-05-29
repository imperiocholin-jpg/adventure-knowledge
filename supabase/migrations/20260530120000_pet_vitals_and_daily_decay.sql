-- 饱食度默认 80、精神/亲密字段、每日衰减日期
alter table if exists public.pets
  alter column hunger set default 80;

alter table if exists public.pets
  add column if not exists spirit integer not null default 80,
  add column if not exists bond integer not null default 80,
  add column if not exists last_daily_decay_date date null;

comment on column public.pets.hunger is '饱食度 0-100，0 为死亡';
comment on column public.pets.spirit is '精神值 0-100';
comment on column public.pets.bond is '亲密值 0-100';
comment on column public.pets.last_daily_decay_date is '上次每日饱食度衰减日期';
