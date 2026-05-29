-- 用户资料：学校、年级班级、年龄（注册资料步填写）

alter table if exists public.users
  add column if not exists email text null,
  add column if not exists school_name text null,
  add column if not exists grade_class text null,
  add column if not exists age integer null;

comment on column public.users.email is '登录邮箱（与 auth.users 同步）';
comment on column public.users.school_name is '就读学校';
comment on column public.users.grade_class is '年级班级，如三年级2班';
comment on column public.users.age is '年龄';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_age_range_check'
  ) then
    alter table public.users
      add constraint users_age_range_check check (age is null or (age >= 5 and age <= 18));
  end if;
exception
  when duplicate_object then null;
end $$;
