-- 等级与生命阶段字段（v2 方案 A）
alter table if exists public.pets
  add column if not exists pet_level integer not null default 1,
  add column if not exists life_stage text not null default '幼崽';

comment on column public.pets.pet_level is '宠物等级 1-50，由 pet_exp 按方案 A 计算';
comment on column public.pets.life_stage is '幼崽 | 成年 | 壮年';
