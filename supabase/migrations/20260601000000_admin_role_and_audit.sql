-- 运营后台：管理员角色 + 操作审计

alter table if exists public.users
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check check (role in ('user', 'admin'));
  end if;
exception
  when duplicate_object then null;
end $$;

comment on column public.users.role is '用户角色：user | admin';

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id);

alter table public.admin_audit_log enable row level security;
