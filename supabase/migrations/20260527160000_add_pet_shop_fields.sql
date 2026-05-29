-- 宠物商城闭环所需字段（背包 / 三维状态 / 死亡标记）
alter table if exists public.pets
  add column if not exists pet_inventory jsonb not null default '{}'::jsonb,
  add column if not exists hunger integer not null default 100,
  add column if not exists pet_exp integer not null default 0,
  add column if not exists is_dead boolean not null default false,
  add column if not exists dead_at timestamptz null;

-- 兼容旧字段：若已有 intimacy / energy，同步到 bond / spirit 读取逻辑可继续用原字段
comment on column public.pets.pet_inventory is '宠物背包：{ itemId: quantity }';
comment on column public.pets.hunger is '饥饿值 0-100，0 为死亡';
comment on column public.pets.pet_exp is '宠物经验，用于等级进度';
