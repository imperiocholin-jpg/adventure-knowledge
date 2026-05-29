-- 用户可选头像 ID（对应 public/image/avatars/{id}.png）
alter table if exists public.users
  add column if not exists avatar_id text;

comment on column public.users.avatar_id is 'Student avatar id, e.g. boy-01, girl-15';
